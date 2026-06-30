import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockLibrary } from './fixtures/games'
import {
  broadcastToRenderers,
  clearCachedLibrary,
  handlers,
  readCachedLibrary,
  registerIpcHandlers,
  resetIpcHandlerMocks,
  setE2eGalaxyDbPath,
  setE2ePsnFixture,
  writeCachedLibrary,
} from './helpers/ipcHandlerMocks'

describe('e2e ipc handlers', () => {
  beforeEach(async () => {
    resetIpcHandlerMocks()
    vi.unstubAllEnvs()
    await registerIpcHandlers()
  })

  it('registers e2e helpers when E2E_TEST is enabled', async () => {
    vi.stubEnv('E2E_TEST', '1')
    handlers.clear()
    await registerIpcHandlers()

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
    await registerIpcHandlers()

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
