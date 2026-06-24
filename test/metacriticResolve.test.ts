import { mkdir, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AggregatedLibrary, Game } from '@shared/types/game'

const userDataDir = path.join(os.tmpdir(), `metacritic-resolve-test-${process.pid}`)

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
  resetE2eMetacriticApiCallCount: vi.fn(),
  getE2eMetacriticApiCallCount: vi.fn(),
}))

const { _resetCacheForTesting } = await import('../electron/metadata/metacritic/cache')
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

describe('metacritic enrichment resolution', () => {
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

  it('resolves ratings directly from slug guesses', async () => {
    fetchGameDetails.mockResolvedValue({
      slug: 'hades',
      title: 'Hades',
      metascore: 93,
      userScore: 9,
      url: 'https://www.metacritic.com/game/hades/',
    })

    const result = await enrichLibraryWithMetacritic(
      library([game({ id: 'steam:1', title: 'Hades' })]),
    )

    expect(searchGames).not.toHaveBeenCalled()
    expect(result.games[0].metacritic?.metascore).toBe(93)
  })

  it('reports incremental game updates while enriching', async () => {
    fetchGameDetails.mockResolvedValue({
      slug: 'hades',
      title: 'Hades',
      metascore: 93,
      userScore: 9,
      url: 'https://www.metacritic.com/game/hades/',
    })

    const updates: { gameId: string; rating: { metascore?: number } }[] = []
    await enrichLibraryWithMetacritic(library([game({ id: 'steam:1', title: 'Hades' })]), {
      onGamesEnriched: (batch) => updates.push(...batch),
    })

    expect(updates).toEqual([
      {
        gameId: 'steam:1',
        rating: expect.objectContaining({ metascore: 93, userScore: 9 }),
      },
    ])
  })

  it('falls back to search results when slug lookup has no scores', async () => {
    fetchGameDetails
      .mockResolvedValueOnce({ slug: 'elden-ring', title: 'Elden Ring' })
      .mockResolvedValueOnce({
        slug: 'elden-ring',
        title: 'Elden Ring',
        metascore: 96,
        userScore: 7.8,
        url: 'https://www.metacritic.com/game/elden-ring/',
      })

    searchGames.mockResolvedValue([
      {
        slug: 'elden-ring',
        title: 'Elden Ring',
        platforms: ['PC'],
        metascore: 96,
        userScore: 7.8,
        url: '/game/elden-ring/',
      },
    ])

    const result = await enrichLibraryWithMetacritic(
      library([game({ id: 'steam:2', title: 'Elden Ring' })]),
    )

    expect(searchGames).toHaveBeenCalledWith('Elden Ring')
    expect(result.games[0].metacritic?.metascore).toBe(96)
  })

  it('uses search hit scores when detail fetch fails', async () => {
    fetchGameDetails.mockResolvedValueOnce(null).mockResolvedValueOnce(null)

    searchGames.mockResolvedValue([
      {
        slug: 'celeste',
        title: 'Celeste',
        platforms: ['PC'],
        metascore: 94,
        userScore: 8.6,
        url: '/game/celeste/',
      },
    ])

    const result = await enrichLibraryWithMetacritic(
      library([game({ id: 'steam:3', title: 'Celeste' })]),
    )

    expect(result.games[0].metacritic).toMatchObject({
      metascore: 94,
      userScore: 8.6,
      url: 'https://www.metacritic.com/game/celeste/',
    })
  })

  it('reports progress and leaves games unchanged when nothing is found', async () => {
    fetchGameDetails.mockResolvedValue(null)
    searchGames.mockResolvedValue([])

    const progress: Array<{ done: number; total: number; enriched: number }> = []
    const result = await enrichLibraryWithMetacritic(
      library([game({ id: 'steam:4', title: 'Unknown Game XYZ' })]),
      {
        onStart: (total) => progress.push({ done: 0, total, enriched: 0 }),
        onProgress: (value) => progress.push(value),
      },
    )

    expect(result.games[0].metacritic).toBeUndefined()
    expect(progress.at(-1)).toEqual({ done: 1, total: 1, enriched: 0 })
  })

  it('continues enrichment when a worker throws', async () => {
    fetchGameDetails.mockRejectedValueOnce(new Error('boom'))
    fetchGameDetails.mockResolvedValue({
      slug: 'hades',
      title: 'Hades',
      metascore: 93,
      userScore: 9,
      url: 'https://www.metacritic.com/game/hades/',
    })

    const result = await enrichLibraryWithMetacritic(
      library([
        game({ id: 'steam:5', title: 'Broken Lookup' }),
        game({ id: 'steam:6', title: 'Hades' }),
      ]),
    )

    expect(result.games.find((entry) => entry.id === 'steam:6')?.metacritic?.metascore).toBe(93)
  })

  it('stores negative cache entries when fetched details have no scores', async () => {
    fetchGameDetails.mockResolvedValue({
      slug: 'empty-game',
      title: 'Empty Game',
      url: 'https://www.metacritic.com/game/empty-game/',
    })
    searchGames.mockResolvedValue([])

    const result = await enrichLibraryWithMetacritic(
      library([game({ id: 'steam:7', title: 'Empty Game' })]),
    )

    expect(result.games[0].metacritic).toBeUndefined()
  })
})
