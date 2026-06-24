import { ipcMain } from 'electron'
import type { AggregatedLibrary, GamePlatform, MetacriticEnrichmentProgress } from '../../../shared/types/game'
import { GAME_PLATFORMS } from '../../../shared/types/game'
import { createScopedLogger } from '../../lib/logger'
import { enrichLibraryWithMetacritic } from '../../metadata/metacritic'
import {
  clearMetacriticCache,
  replaceMetacriticCache,
  type MetacriticCacheFile,
} from '../../metadata/metacritic/cache'
import {
  getE2eMetacriticApiCallCount,
  resetE2eMetacriticApiCallCount,
} from '../../metadata/metacritic/api'
import { getRecommendations } from '../../recommendations'
import { getGithubPat } from '../settings/store'
import { clearCachedLibrary, readCachedLibrary, writeCachedLibrary } from '../library/store'
import { scanAllGamesWithoutMetacritic, scanPlatform } from '../../scanners'
import { setE2eGalaxyDbPath } from '../../scanners/gog/paths'
import { setE2ePsnFixture, type PsnE2eFixture } from '../../scanners/psn/e2e'
import { broadcastToRenderers } from './broadcast'

const logger = createScopedLogger('ipc:games')

let metacriticEnrichmentInProgress = false

function startMetacriticEnrichment(library: AggregatedLibrary): void {
  metacriticEnrichmentInProgress = true
  const startedAt = performance.now()
  let enrichmentTotal = 0
  let lastProgress: MetacriticEnrichmentProgress = { done: 0, total: 0, enriched: 0 }

  void enrichLibraryWithMetacritic(library, {
    onStart: (total) => {
      enrichmentTotal = total
      lastProgress = { done: 0, total, enriched: 0 }
      broadcastToRenderers('games:metacritic-enrichment-started', { total })
    },
    onProgress: (progress) => {
      lastProgress = progress
      broadcastToRenderers('games:metacritic-enrichment-progress', progress)
    },
    onGamesEnriched: (updates) => {
      broadcastToRenderers('games:metacritic-ratings-updated', { updates })
    },
  })
    .then(async (enriched) => {
      const durationMs = Math.round(performance.now() - startedAt)
      const enrichedCount = enriched.games.filter((game) => game.metacritic).length
      const total = enrichmentTotal || lastProgress.total

      await writeCachedLibrary(enriched)
      broadcastToRenderers('games:metacritic-enrichment-finished', {
        done: lastProgress.done || total,
        total,
        enriched: enrichedCount,
        durationMs,
      })
      broadcastToRenderers('games:library-updated', enriched)
      logger.info('games:enrich-metacritic finished', {
        gameCount: enriched.games.length,
        enriched: enrichedCount,
        durationMs,
      })
    })
    .catch((error) => {
      broadcastToRenderers('games:metacritic-enrichment-failed', {})
      logger.warn('games:enrich-metacritic failed', error)
    })
    .finally(() => {
      metacriticEnrichmentInProgress = false
    })
}

export function registerGameIpcHandlers(): void {
  ipcMain.handle('games:get-library', async () => {
    const startedAt = performance.now()
    const library = await readCachedLibrary()
    const durationMs = Math.round(performance.now() - startedAt)

    logger.info('games:get-library finished', {
      durationMs,
      gameCount: library?.games.length ?? 0,
      cached: library !== null,
    })

    return library
  })

  if (process.env.E2E_TEST === '1') {
    ipcMain.handle('e2e:write-library-cache', (_event, library: AggregatedLibrary) =>
      writeCachedLibrary(library),
    )
    ipcMain.handle('e2e:clear-library-cache', () => clearCachedLibrary())
    ipcMain.handle('e2e:set-gog-galaxy-db', (_event, dbPath: string | null) => {
      setE2eGalaxyDbPath(dbPath)
    })
    ipcMain.handle('e2e:set-psn-fixture', (_event, fixture: PsnE2eFixture | null) => {
      setE2ePsnFixture(fixture)
    })
    ipcMain.handle('e2e:write-metacritic-cache', (_event, cache: MetacriticCacheFile) =>
      replaceMetacriticCache(cache),
    )
    ipcMain.handle('e2e:clear-metacritic-cache', () => clearMetacriticCache())
    ipcMain.handle('e2e:reset-metacritic-api-call-count', () => {
      resetE2eMetacriticApiCallCount()
    })
    ipcMain.handle('e2e:get-metacritic-api-call-count', () => getE2eMetacriticApiCallCount())
    ipcMain.handle('e2e:enrich-metacritic-cached', async () => {
      const library = await readCachedLibrary()
      if (!library || library.games.length === 0) {
        throw new Error('No library to enrich — scan your libraries first.')
      }

      resetE2eMetacriticApiCallCount()
      logger.info('e2e:enrich-metacritic-cached invoked', { gameCount: library.games.length })
      startMetacriticEnrichment(library)
      return { started: true as const }
    })
    ipcMain.handle('e2e:simulate-metacritic-enrichment', async (_event, enriched: AggregatedLibrary) => {
      const total = enriched.games.length
      const enrichedCount = enriched.games.filter((game) => game.metacritic).length
      const startedAt = performance.now()

      broadcastToRenderers('games:metacritic-enrichment-started', { total })

      let done = 0
      let enrichedSoFar = 0
      for (const game of enriched.games) {
        done += 1
        if (game.metacritic) {
          enrichedSoFar += 1
          broadcastToRenderers('games:metacritic-ratings-updated', {
            updates: [{ gameId: game.id, rating: game.metacritic }],
          })
          await new Promise((resolve) => setTimeout(resolve, 75))
        }
        broadcastToRenderers('games:metacritic-enrichment-progress', {
          done,
          total,
          enriched: enrichedSoFar,
        })
      }

      await writeCachedLibrary(enriched)

      const durationMs = Math.max(1, Math.round(performance.now() - startedAt))
      broadcastToRenderers('games:metacritic-enrichment-finished', {
        done: total,
        total,
        enriched: enrichedCount,
        durationMs,
      })
      broadcastToRenderers('games:library-updated', enriched)

      return { started: true as const }
    })
  }

  ipcMain.handle('games:scan-all', async () => {
    logger.info('games:scan-all invoked')
    const library = await scanAllGamesWithoutMetacritic()
    await writeCachedLibrary(library)
    logger.info('games:scan-all finished', { gameCount: library.games.length })

    return library
  })

  ipcMain.handle('games:enrich-metacritic', async () => {
    if (process.env.E2E_TEST === '1') {
      throw new Error('Metacritic enrichment is disabled in E2E tests')
    }

    if (metacriticEnrichmentInProgress) {
      throw new Error('Metacritic enrichment is already running')
    }

    const library = await readCachedLibrary()
    if (!library || library.games.length === 0) {
      throw new Error('No library to enrich — scan your libraries first.')
    }

    logger.info('games:enrich-metacritic invoked', { gameCount: library.games.length })
    startMetacriticEnrichment(library)
    return { started: true as const }
  })

  ipcMain.handle('games:scan-platform', (_event, platform: GamePlatform) => {
    if (!GAME_PLATFORMS.includes(platform)) {
      logger.error('games:scan-platform unknown platform', { platform })
      throw new Error(`Unknown platform: ${platform}`)
    }
    logger.info('games:scan-platform invoked', { platform })
    return scanPlatform(platform).then((result) => {
      logger.info('games:scan-platform finished', {
        platform,
        gameCount: result.games.length,
        errorCount: result.errors.length,
      })
      return result
    })
  })

  ipcMain.handle('games:get-recommendations', async () => {
    logger.info('games:get-recommendations invoked')
    const library = await readCachedLibrary()
    if (!library) {
      logger.warn('games:get-recommendations — no cached library')
      return {
        owned: [],
        discover: [],
        errors: ['Brak zeskanowanej biblioteki — najpierw uruchom skanowanie.'],
        basedOnPlayedCount: 0,
      }
    }
    const pat = await getGithubPat()
    const result = await getRecommendations(library, pat)
    logger.info('games:get-recommendations finished', {
      ownedCount: result.owned.length,
      discoverCount: result.discover.length,
      errorCount: result.errors.length,
      basedOnPlayedCount: result.basedOnPlayedCount,
    })
    return result
  })
}
