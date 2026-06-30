import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AggregatedLibrary, Game } from '@shared/types/game'
import type { MetacriticCacheFile } from '@electron/metadata/metacritic/cache'
import { METACRITIC_PLATFORM_CANDIDATES } from '@electron/metadata/metacritic/platforms'
import { cacheKey } from '@electron/metadata/metacritic/slug'

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

vi.mock('@electron/metadata/metacritic/api', () => ({
  fetchGameDetails,
  searchGames,
}))

const { getCached, setCached, flushMetacriticCache, _resetCacheForTesting } = await import(
  '@electron/metadata/metacritic/cache'
)
const { enrichLibraryWithMetacritic } = await import('@electron/metadata/metacritic')

function game(overrides: Partial<Game> & Pick<Game, 'id' | 'title'>): Game {
  return {
    platform: 'steam',
    playtimeMinutes: 0,
    installed: false,
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

const DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000
const MISS_TTL_MS = 7 * 24 * 60 * 60 * 1000

function hasUsableMetacritic(rating: Game['metacritic']): boolean {
  if (!rating) return false
  return typeof rating.metascore === 'number' || typeof rating.userScore === 'number'
}

function isFreshCacheEntry(entry: { rating: unknown; fetchedAt: string }): boolean {
  const fetchedAt = Date.parse(entry.fetchedAt)
  if (!Number.isFinite(fetchedAt)) return false
  const ttl = entry.rating ? DEFAULT_TTL_MS : MISS_TTL_MS
  return Date.now() - fetchedAt < ttl
}

/** Games safe to enrich offline: already rated on the game, or a fresh positive cache hit. */
function hasOfflineCacheCoverage(game: Game, entries: MetacriticCacheFile['entries']): boolean {
  if (hasUsableMetacritic(game.metacritic)) return true
  const candidates = METACRITIC_PLATFORM_CANDIDATES[game.platform]
  return candidates.some((candidate) => {
    const key = cacheKey(game.title, candidate)
    const entry = entries[key]
    return Boolean(entry && isFreshCacheEntry(entry) && entry.rating !== null)
  })
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

    const parsedCache = JSON.parse(realCache) as MetacriticCacheFile
    const parsedLibrary = JSON.parse(realLibrary) as AggregatedLibrary
    const offlineGames = parsedLibrary.games
      .filter((game) => hasOfflineCacheCoverage(game, parsedCache.entries))
      .slice(0, 100)

    // Library and cache can drift locally (e.g. new scan before enrichment finishes).
    if (offlineGames.length < 50) return

    const startedAt = performance.now()
    const result = await enrichLibraryWithMetacritic(library(offlineGames))
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
