import type { AggregatedLibrary, MetacriticEnrichmentProgress } from '../../../shared/types/game'
import { createScopedLogger } from '../../lib/logger'
import { enrichLibraryWithMetacritic } from '../../metadata/metacritic'
import { writeCachedLibrary } from '../library/store'
import { broadcastToRenderers } from './broadcast'

const logger = createScopedLogger('ipc:metacritic-enrichment')

let metacriticEnrichmentInProgress = false

export function isMetacriticEnrichmentInProgress(): boolean {
  return metacriticEnrichmentInProgress
}

export function startMetacriticEnrichment(library: AggregatedLibrary): void {
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

export async function simulateMetacriticEnrichment(
  enriched: AggregatedLibrary,
): Promise<{ started: true }> {
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
}
