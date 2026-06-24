import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AggregatedLibrary, GamePlatform } from '@shared/types/game'
import { createMockLibrary } from './fixtures/games'

const handlers = new Map<string, (...args: unknown[]) => unknown>()

const scanAllGames = vi.fn<() => Promise<AggregatedLibrary>>()
const scanPlatform = vi.fn<(platform: GamePlatform) => Promise<unknown>>()
const readCachedLibrary = vi.fn<() => Promise<AggregatedLibrary | null>>()
const writeCachedLibrary = vi.fn<(library: AggregatedLibrary) => Promise<void>>()
const clearCachedLibrary = vi.fn<() => Promise<void>>()
const setE2eGalaxyDbPath = vi.fn<(dbPath: string | null) => void>()
const setE2ePsnFixture = vi.fn<(fixture: unknown) => void>()
const getSettingsState = vi.fn<() => Promise<unknown>>()
const updateSteamApiKey = vi.fn<(value: string | undefined) => Promise<void>>()
const updateGithubPat = vi.fn<(value: string | undefined) => Promise<void>>()
const getGithubPat = vi.fn<() => Promise<string | undefined>>()
const updatePsnNpsso = vi.fn<(value: string | undefined) => Promise<void>>()
const updatePsnOnlineId = vi.fn<(value: string | undefined) => Promise<void>>()
const enrichLibraryWithMetacritic = vi.fn<
  (
    library: AggregatedLibrary,
    options?: {
      onStart?: (total: number) => void
      onProgress?: (progress: { done: number; total: number; enriched: number }) => void
      onGamesEnriched?: (updates: { gameId: string; rating: { metascore?: number } }[]) => void
    },
  ) => Promise<AggregatedLibrary>
>()
const getRecommendations = vi.fn<() => Promise<unknown>>()
const broadcastToRenderers = vi.fn<(channel: string, payload: unknown) => void>()

vi.mock('electron', () => ({
  BrowserWindow: {
    getAllWindows: vi.fn(() => []),
  },
  ipcMain: {
    handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
      handlers.set(channel, handler)
    }),
  },
}))

vi.mock('../electron/scanners', () => ({
  scanAllGames,
  scanAllGamesWithoutMetacritic: scanAllGames,
  scanPlatform,
}))

vi.mock('../electron/main/library/store', () => ({
  readCachedLibrary,
  writeCachedLibrary,
  clearCachedLibrary,
}))

vi.mock('../electron/scanners/gog/paths', () => ({
  setE2eGalaxyDbPath,
}))

vi.mock('../electron/scanners/psn/e2e', () => ({
  setE2ePsnFixture,
}))

vi.mock('../electron/main/settings/store', () => ({
  getSettingsState,
  updateSteamApiKey,
  updateGithubPat,
  getGithubPat,
  updatePsnNpsso,
  updatePsnOnlineId,
}))

vi.mock('../electron/metadata/metacritic', () => ({
  enrichLibraryWithMetacritic,
}))

vi.mock('../electron/recommendations', () => ({
  getRecommendations,
}))

vi.mock('../electron/main/ipc/broadcast', () => ({
  broadcastToRenderers,
}))

const { registerGameIpcHandlers } = await import('../electron/main/ipc/games')
const { registerSettingsIpcHandlers } = await import('../electron/main/ipc/settings')

describe('ipc handlers', () => {
  beforeEach(() => {
    handlers.clear()
    scanAllGames.mockReset()
    scanPlatform.mockReset()
    readCachedLibrary.mockReset()
    writeCachedLibrary.mockReset()
    clearCachedLibrary.mockReset()
    setE2eGalaxyDbPath.mockReset()
    setE2ePsnFixture.mockReset()
    getSettingsState.mockReset()
    updateSteamApiKey.mockReset()
    updateGithubPat.mockReset()
    getGithubPat.mockReset()
    updatePsnNpsso.mockReset()
    updatePsnOnlineId.mockReset()
    enrichLibraryWithMetacritic.mockReset()
    getRecommendations.mockReset()
    broadcastToRenderers.mockReset()
    enrichLibraryWithMetacritic.mockImplementation(async (library, options) => {
      options?.onStart?.(library.games.length)
      options?.onProgress?.({ done: library.games.length, total: library.games.length, enriched: 0 })
      return library
    })

    registerGameIpcHandlers()
    registerSettingsIpcHandlers()
  })

  it('returns cached library', async () => {
    const library = createMockLibrary()
    readCachedLibrary.mockResolvedValue(library)

    await expect(handlers.get('games:get-library')!()).resolves.toEqual(library)
  })

  it('scans all platforms and writes cache', async () => {
    const library = createMockLibrary()
    scanAllGames.mockResolvedValue(library)

    await expect(handlers.get('games:scan-all')!()).resolves.toEqual(library)
    expect(writeCachedLibrary).toHaveBeenCalledWith(library)
    expect(enrichLibraryWithMetacritic).not.toHaveBeenCalled()
  })

  it('enriches cached library with metacritic in the background', async () => {
    const library = createMockLibrary()
    const enrichedLibrary = {
      ...library,
      games: library.games.map((game, index) =>
        index === 0
          ? {
              ...game,
              metacritic: {
                metascore: 90,
                fetchedAt: '2024-01-01T00:00:00.000Z',
              },
            }
          : game,
      ),
    }
    readCachedLibrary.mockResolvedValue(library)
    enrichLibraryWithMetacritic.mockImplementation(async (cachedLibrary, options) => {
      const rating = {
        metascore: 90,
        fetchedAt: '2024-01-01T00:00:00.000Z',
      }
      options?.onStart?.(cachedLibrary.games.length)
      options?.onGamesEnriched?.([{ gameId: cachedLibrary.games[0].id, rating }])
      options?.onProgress?.({
        done: cachedLibrary.games.length,
        total: cachedLibrary.games.length,
        enriched: 1,
      })
      return enrichedLibrary
    })

    await expect(handlers.get('games:enrich-metacritic')!()).resolves.toEqual({ started: true })
    await vi.waitFor(() => {
      expect(enrichLibraryWithMetacritic).toHaveBeenCalledWith(library, expect.any(Object))
    })
    await vi.waitFor(() => {
      expect(broadcastToRenderers).toHaveBeenCalledWith(
        'games:metacritic-enrichment-finished',
        expect.objectContaining({
          total: library.games.length,
          enriched: 1,
        }),
      )
    })
    expect(broadcastToRenderers).toHaveBeenCalledWith('games:metacritic-enrichment-started', {
      total: library.games.length,
    })
    expect(broadcastToRenderers).toHaveBeenCalledWith('games:metacritic-ratings-updated', {
      updates: [{ gameId: library.games[0].id, rating: expect.objectContaining({ metascore: 90 }) }],
    })
    expect(writeCachedLibrary).toHaveBeenCalledWith(enrichedLibrary)
    expect(broadcastToRenderers).toHaveBeenCalledWith('games:library-updated', enrichedLibrary)
  })

  it('rejects metacritic enrichment when library cache is empty', async () => {
    readCachedLibrary.mockResolvedValue(null)

    await expect(handlers.get('games:enrich-metacritic')!()).rejects.toThrow(
      'No library to enrich — scan your libraries first.',
    )
  })

  it('returns recommendations from cached library', async () => {
    const library = createMockLibrary()
    const recommendations = {
      owned: [{ title: 'Hades', reason: 'Similar roguelike' }],
      discover: [],
      errors: [],
      basedOnPlayedCount: 2,
    }

    readCachedLibrary.mockResolvedValue(library)
    getGithubPat.mockResolvedValue('ghp_test')
    getRecommendations.mockResolvedValue(recommendations)

    await expect(handlers.get('games:get-recommendations')!()).resolves.toEqual(recommendations)
    expect(getRecommendations).toHaveBeenCalledWith(library, 'ghp_test')
  })

  it('returns empty recommendations when library cache is missing', async () => {
    readCachedLibrary.mockResolvedValue(null)

    await expect(handlers.get('games:get-recommendations')!()).resolves.toEqual({
      owned: [],
      discover: [],
      errors: ['Brak zeskanowanej biblioteki — najpierw uruchom skanowanie.'],
      basedOnPlayedCount: 0,
    })
    expect(getRecommendations).not.toHaveBeenCalled()
  })

  it('delegates platform scan and rejects unknown platforms', async () => {
    scanPlatform.mockResolvedValue({ platform: 'steam', games: [], errors: [] })

    await expect(handlers.get('games:scan-platform')!(null, 'steam')).resolves.toMatchObject({
      platform: 'steam',
    })
    expect(scanPlatform).toHaveBeenCalledWith('steam')

    expect(() => handlers.get('games:scan-platform')!(null, 'unknown')).toThrow(
      'Unknown platform: unknown',
    )
  })

  it('returns settings state', async () => {
    getSettingsState.mockResolvedValue({
      steamApiKeySet: false,
      githubPatSet: false,
      psnNpssoSet: false,
    })

    await expect(handlers.get('settings:get')!()).resolves.toEqual({
      steamApiKeySet: false,
      githubPatSet: false,
      psnNpssoSet: false,
    })
  })

  it('applies settings updates and returns fresh state', async () => {
    getSettingsState.mockResolvedValue({
      steamApiKeySet: true,
      githubPatSet: true,
      psnNpssoSet: true,
      psnOnlineId: 'player',
    })

    await expect(
      handlers.get('settings:update')!(null, {
        steamApiKey: 'key',
        githubPat: 'ghp_test',
        psnNpsso: 'npsso',
        psnOnlineId: 'player',
      }),
    ).resolves.toEqual({
      steamApiKeySet: true,
      githubPatSet: true,
      psnNpssoSet: true,
      psnOnlineId: 'player',
    })

    expect(updateSteamApiKey).toHaveBeenCalledWith('key')
    expect(updateGithubPat).toHaveBeenCalledWith('ghp_test')
    expect(updatePsnNpsso).toHaveBeenCalledWith('npsso')
    expect(updatePsnOnlineId).toHaveBeenCalledWith('player')
  })
})

describe('e2e ipc handlers', () => {
  beforeEach(() => {
    handlers.clear()
    writeCachedLibrary.mockReset()
    broadcastToRenderers.mockReset()
    readCachedLibrary.mockReset()
    enrichLibraryWithMetacritic.mockReset()
    vi.unstubAllEnvs()
    registerGameIpcHandlers()
  })

  it('registers e2e helpers when E2E_TEST is enabled', async () => {
    vi.stubEnv('E2E_TEST', '1')
    handlers.clear()
    registerGameIpcHandlers()

    const library = createMockLibrary()
    await handlers.get('e2e:write-library-cache')!(null, library)
    expect(writeCachedLibrary).toHaveBeenCalledWith(library)

    await handlers.get('e2e:clear-library-cache')!()
    expect(clearCachedLibrary).toHaveBeenCalled()

    await handlers.get('e2e:set-gog-galaxy-db')!(null, '/tmp/galaxy.db')
    expect(setE2eGalaxyDbPath).toHaveBeenCalledWith('/tmp/galaxy.db')

    const fixture = { purchasedGames: [] }
    await handlers.get('e2e:set-psn-fixture')!(null, fixture)
    expect(setE2ePsnFixture).toHaveBeenCalledWith(fixture)
  })

  it('simulates metacritic enrichment broadcasts in e2e mode', async () => {
    vi.stubEnv('E2E_TEST', '1')
    handlers.clear()
    registerGameIpcHandlers()

    const library = createMockLibrary()
    const enrichedLibrary = {
      ...library,
      games: library.games.map((game) => ({
        ...game,
        metacritic: {
          metascore: 90,
          fetchedAt: '2024-01-01T00:00:00.000Z',
        },
      })),
    }

    await handlers.get('e2e:simulate-metacritic-enrichment')!(null, enrichedLibrary)

    expect(writeCachedLibrary).toHaveBeenCalledWith(enrichedLibrary)
    expect(broadcastToRenderers).toHaveBeenCalledWith(
      'games:metacritic-enrichment-started',
      { total: enrichedLibrary.games.length },
    )
    expect(broadcastToRenderers).toHaveBeenCalledWith(
      'games:metacritic-ratings-updated',
      expect.objectContaining({
        updates: [
          expect.objectContaining({
            gameId: enrichedLibrary.games[0].id,
            rating: expect.objectContaining({ metascore: 90 }),
          }),
        ],
      }),
    )
    expect(broadcastToRenderers).toHaveBeenCalledWith(
      'games:metacritic-enrichment-progress',
      expect.objectContaining({ done: 1, total: enrichedLibrary.games.length, enriched: 1 }),
    )
    expect(broadcastToRenderers).toHaveBeenCalledWith(
      'games:metacritic-enrichment-finished',
      expect.objectContaining({
        total: enrichedLibrary.games.length,
        enriched: enrichedLibrary.games.length,
      }),
    )
    expect(broadcastToRenderers).toHaveBeenCalledWith(
      'games:library-updated',
      enrichedLibrary,
    )

    const ratingsUpdatedCalls = broadcastToRenderers.mock.calls.filter(
      ([channel]) => channel === 'games:metacritic-ratings-updated',
    )
    expect(ratingsUpdatedCalls).toHaveLength(enrichedLibrary.games.length)
  })
})
