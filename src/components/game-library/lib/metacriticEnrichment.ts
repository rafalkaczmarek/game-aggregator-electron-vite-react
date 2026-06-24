import type {
  AggregatedLibrary,
  MetacriticEnrichmentFinished,
  MetacriticEnrichmentProgress,
  MetacriticRatingUpdate,
} from '@shared/types/game'

export type MetacriticEnrichmentUiState =
  | { status: 'idle' }
  | ({ status: 'running' } & MetacriticEnrichmentProgress)
  | ({ status: 'finished' } & MetacriticEnrichmentFinished)
  | { status: 'failed' }

export function enrichmentPercent(progress: MetacriticEnrichmentProgress): number {
  if (progress.total <= 0) return 100
  return Math.min(100, Math.round((progress.done / progress.total) * 100))
}

export function formatEnrichmentDuration(durationMs: number): string {
  const seconds = Math.max(1, Math.round(durationMs / 1000))
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return remainder > 0 ? `${minutes}m ${remainder}s` : `${minutes}m`
}

export function applyMetacriticRatingUpdates(
  library: AggregatedLibrary,
  updates: MetacriticRatingUpdate[],
): AggregatedLibrary {
  if (updates.length === 0) return library

  const updateMap = new Map(updates.map((update) => [update.gameId, update.rating]))

  return {
    ...library,
    games: library.games.map((game) => {
      const rating = updateMap.get(game.id)
      return rating ? { ...game, metacritic: rating } : game
    }),
    results: library.results.map((result) => ({
      ...result,
      games: result.games.map((game) => {
        const rating = updateMap.get(game.id)
        return rating ? { ...game, metacritic: rating } : game
      }),
    })),
  }
}
