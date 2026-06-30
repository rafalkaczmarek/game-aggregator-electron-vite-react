import { describe, expect, it } from 'vitest'
import {
  enrichmentPercent,
  formatEnrichmentDuration,
  applyMetacriticRatingUpdates,
} from '@src/components/game-library/lib/metacriticEnrichment'
import { createMockLibrary } from '@test/fixtures/games'

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

  it('returns the same library reference when there are no updates', () => {
    const library = createMockLibrary()
    expect(applyMetacriticRatingUpdates(library, [])).toBe(library)
  })

  it('applies multiple rating updates in a single batch', () => {
    const library = createMockLibrary()
    const dotaRating = {
      metascore: 90,
      userScore: 6.8,
      fetchedAt: '2024-01-01T00:00:00.000Z',
    }
    const cyberpunkRating = {
      metascore: 86,
      userScore: 7.2,
      fetchedAt: '2024-01-01T00:00:00.000Z',
    }

    const updated = applyMetacriticRatingUpdates(library, [
      { gameId: library.games[0].id, rating: dotaRating },
      { gameId: library.games[1].id, rating: cyberpunkRating },
    ])

    expect(updated.games[0].metacritic).toEqual(dotaRating)
    expect(updated.games[1].metacritic).toEqual(cyberpunkRating)
    expect(updated.games[2].metacritic).toBeUndefined()
    expect(updated.results.find((result) => result.platform === 'gog')?.games[0].metacritic).toEqual(
      cyberpunkRating,
    )
  })

  it('ignores updates for unknown game ids', () => {
    const library = createMockLibrary()
    const updated = applyMetacriticRatingUpdates(library, [
      {
        gameId: 'missing-game',
        rating: { metascore: 50, fetchedAt: '2024-01-01T00:00:00.000Z' },
      },
    ])

    expect(updated).toEqual(library)
    expect(updated.games.every((game) => game.metacritic === undefined)).toBe(true)
  })

  it('does not mutate the original library', () => {
    const library = createMockLibrary()
    const originalGames = library.games

    applyMetacriticRatingUpdates(library, [
      {
        gameId: library.games[0].id,
        rating: { metascore: 90, fetchedAt: '2024-01-01T00:00:00.000Z' },
      },
    ])

    expect(library.games).toBe(originalGames)
    expect(library.games[0].metacritic).toBeUndefined()
  })
})
