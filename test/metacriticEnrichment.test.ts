import { describe, expect, it } from 'vitest'
import {
  enrichmentPercent,
  formatEnrichmentDuration,
  applyMetacriticRatingUpdates,
} from '@src/components/game-library/lib/metacriticEnrichment'
import { createMockLibrary } from './fixtures/games'

describe('metacriticEnrichment helpers', () => {
  it('computes enrichment percent', () => {
    expect(enrichmentPercent({ done: 0, total: 0, enriched: 0 })).toBe(100)
    expect(enrichmentPercent({ done: 1, total: 4, enriched: 1 })).toBe(25)
    expect(enrichmentPercent({ done: 40, total: 40, enriched: 20 })).toBe(100)
  })

  it('formats enrichment duration', () => {
    expect(formatEnrichmentDuration(500)).toBe('1s')
    expect(formatEnrichmentDuration(45_000)).toBe('45s')
    expect(formatEnrichmentDuration(125_000)).toBe('2m 5s')
    expect(formatEnrichmentDuration(120_000)).toBe('2m')
  })

  it('merges incremental metacritic rating updates into the library', () => {
    const library = createMockLibrary()
    const rating = {
      metascore: 90,
      userScore: 6.8,
      fetchedAt: '2024-01-01T00:00:00.000Z',
    }

    const updated = applyMetacriticRatingUpdates(library, [
      { gameId: library.games[0].id, rating },
    ])

    expect(updated.games[0].metacritic).toEqual(rating)
    expect(updated.results[0].games[0].metacritic).toEqual(rating)
    expect(updated.games[1].metacritic).toBeUndefined()
  })
})
