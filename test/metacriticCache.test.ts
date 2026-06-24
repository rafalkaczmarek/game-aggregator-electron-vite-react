import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AggregatedLibrary, Game } from '@shared/types/game'
import { cacheKey } from '../electron/metadata/metacritic/slug'

const userDataDir = path.join(os.tmpdir(), `metacritic-cache-test-${process.pid}`)

vi.mock('electron', () => ({
  app: {
    getPath: (name: string) => {
      if (name === 'userData') return userDataDir
      throw new Error(`unexpected getPath: ${name}`)
    },
  },
}))

const fetchGameDetails = vi.fn()
const searchGames = vi.fn()

vi.mock('../electron/metadata/metacritic/api', () => ({
  fetchGameDetails,
  searchGames,
}))

const { getCached, setCached, flushMetacriticCache, _resetCacheForTesting } = await import(
  '../electron/metadata/metacritic/cache'
)
const { enrichLibraryWithMetacritic } = await import('../electron/metadata/metacritic')

function game(overrides: Partial<Game> & Pick<Game, 'id' | 'title'>): Game {
  return {
    platform: 'steam',
    playtimeMinutes: 0,
    ...overrides,
  }
}

function library(games: Game[]): AggregatedLibrary {
  return {
    games,
    scannedAt: new Date().toISOString(),
    results: [{ platform: 'steam', games, errors: [] }],
  }
}

describe('metacritic cache', () => {
  beforeEach(async () => {
    _resetCacheForTesting()
    fetchGameDetails.mockReset()
    searchGames.mockReset()
    await mkdir(userDataDir, { recursive: true })
  })

  afterEach(async () => {
    _resetCacheForTesting()
    await rm(userDataDir, { recursive: true, force: true })
  })

  it('reads a persisted entry from disk after resetting memory cache', async () => {
    const title = 'Elden Ring'
    const rating = {
      metascore: 96,
      userScore: 7.8,
      url: 'https://www.metacritic.com/game/elden-ring/',
      platform: 'pc',
      fetchedAt: new Date().toISOString(),
    }

    await setCached(cacheKey(title, 'pc'), rating)
    await flushMetacriticCache()
    _resetCacheForTesting()

    await expect(getCached(cacheKey(title, 'pc'))).resolves.toEqual(rating)
  })

  it('loads cache file on enrich after memory reset (simulates app restart)', async () => {
    const title = 'Hades'
    const rating = {
      metascore: 93,
      userScore: 9.0,
      url: 'https://www.metacritic.com/game/hades/',
      platform: 'pc',
      fetchedAt: new Date().toISOString(),
    }

    await setCached(cacheKey(title, 'pc'), rating)
    await flushMetacriticCache()
    _resetCacheForTesting()

    const result = await enrichLibraryWithMetacritic(
      library([game({ id: 'steam:1', title })]),
    )

    expect(fetchGameDetails).not.toHaveBeenCalled()
    expect(searchGames).not.toHaveBeenCalled()
    expect(result.games[0].metacritic?.metascore).toBe(93)
  })

  it('reuses existing game.metacritic without calling the API', async () => {
    const existing = {
      metascore: 88,
      userScore: 8.1,
      url: 'https://www.metacritic.com/game/example/',
      platform: 'pc',
      fetchedAt: new Date().toISOString(),
    }

    const result = await enrichLibraryWithMetacritic(
      library([game({ id: 'steam:1', title: 'Example Game', metacritic: existing })]),
    )

    expect(fetchGameDetails).not.toHaveBeenCalled()
    expect(searchGames).not.toHaveBeenCalled()
    expect(result.games[0].metacritic).toEqual(existing)
  })

  it('enriches a large library from disk cache without network calls', async () => {
    const realCachePath = path.join(
      process.env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming'),
      'game-aggregator-electron-vite-react',
      'metacritic-cache.json',
    )
    const realLibraryPath = path.join(
      process.env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming'),
      'game-aggregator-electron-vite-react',
      'library.json',
    )

    const [realCache, realLibrary] = await Promise.all([
      readFile(realCachePath, 'utf8').catch(() => null),
      readFile(realLibraryPath, 'utf8').catch(() => null),
    ])

    if (!realCache || !realLibrary) return

    await writeFile(path.join(userDataDir, 'metacritic-cache.json'), realCache, 'utf8')
    _resetCacheForTesting()

    const parsedLibrary = JSON.parse(realLibrary) as AggregatedLibrary
    const startedAt = performance.now()
    const result = await enrichLibraryWithMetacritic(library(parsedLibrary.games.slice(0, 100)))
    const durationMs = performance.now() - startedAt

    expect(fetchGameDetails).not.toHaveBeenCalled()
    expect(searchGames).not.toHaveBeenCalled()
    expect(result.games.some((game) => game.metacritic?.metascore !== undefined)).toBe(true)
    expect(durationMs).toBeLessThan(2_000)
  })

  it('hydrates file cache from a real-shaped cache file', async () => {
    const realCache = await readFile(
      path.join(
        process.env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming'),
        'game-aggregator-electron-vite-react',
        'metacritic-cache.json',
      ),
      'utf8',
    ).catch(() => null)

    if (!realCache) return

    await writeFile(path.join(userDataDir, 'metacritic-cache.json'), realCache, 'utf8')
    _resetCacheForTesting()

    const parsed = JSON.parse(realCache) as { entries: Record<string, unknown> }
    const firstKey = Object.keys(parsed.entries)[0]
    expect(firstKey).toBeTruthy()

    const cached = await getCached(firstKey)
    expect(cached).not.toBeUndefined()
  })
})
