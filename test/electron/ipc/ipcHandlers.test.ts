import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockLibrary } from '@test/fixtures/games'
import {
  broadcastToRenderers,
  enrichLibraryWithMetacritic,
  fetchSteamStoreDescription,
  getGithubPat,
  getRecommendations,
  getSettingsState,
  handlers,
  readCachedLibrary,
  registerIpcHandlers,
  resetIpcHandlerMocks,
  scanAllGames,
  scanPlatform,
  updateGithubPat,
  updatePsnNpsso,
  updatePsnOnlineId,
  updateSteamApiKey,
  writeCachedLibrary,
} from '@test/helpers/ipcHandlerMocks'

describe('ipc handlers', () => {
  beforeEach(async () => {
    resetIpcHandlerMocks()
    await registerIpcHandlers()
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

    await expect(handlers.get('games:get-recommendations')!(null)).resolves.toEqual(recommendations)
    expect(getRecommendations).toHaveBeenCalledWith(library, 'ghp_test', undefined)
  })

  it('passes user message to recommendations service', async () => {
    const library = createMockLibrary()
    const recommendations = {
      owned: [],
      discover: [{ title: 'Hades', reason: 'Indie hit' }],
      errors: [],
      basedOnPlayedCount: 2,
    }

    readCachedLibrary.mockResolvedValue(library)
    getGithubPat.mockResolvedValue('ghp_test')
    getRecommendations.mockResolvedValue(recommendations)

    await expect(
      handlers.get('games:get-recommendations')!(null, { userMessage: 'gry indie' }),
    ).resolves.toEqual(recommendations)
    expect(getRecommendations).toHaveBeenCalledWith(library, 'ghp_test', {
      userMessage: 'gry indie',
    })
  })

  it('returns empty recommendations when library cache is missing', async () => {
    readCachedLibrary.mockResolvedValue(null)

    await expect(handlers.get('games:get-recommendations')!(null)).resolves.toEqual({
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

  it('returns Steam store description for steam games', async () => {
    fetchSteamStoreDescription.mockResolvedValue('MOBA classic.')

    await expect(
      handlers.get('games:get-game-description')!(null, {
        platform: 'steam',
        sourceId: '570',
      }),
    ).resolves.toEqual({
      text: 'MOBA classic.',
      source: 'steam',
    })
    expect(fetchSteamStoreDescription).toHaveBeenCalledWith('570')
  })

  it('returns null description for non-steam platforms', async () => {
    await expect(
      handlers.get('games:get-game-description')!(null, {
        platform: 'gog',
        sourceId: '1',
      }),
    ).resolves.toBeNull()
    expect(fetchSteamStoreDescription).not.toHaveBeenCalled()
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
