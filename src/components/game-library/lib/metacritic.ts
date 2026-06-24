import type { MetacriticRating } from '@shared/types/game'

export type MetacriticScoreTier = 'positive' | 'mixed' | 'negative' | 'unknown'

/** Metacritic's own colour bands for the Metascore (0-100). */
export function getMetascoreTier(score: number | undefined): MetacriticScoreTier {
  if (typeof score !== 'number' || Number.isNaN(score)) return 'unknown'
  if (score >= 75) return 'positive'
  if (score >= 50) return 'mixed'
  return 'negative'
}

/** Metacritic's own colour bands for the User Score (0-10). */
export function getUserScoreTier(score: number | undefined): MetacriticScoreTier {
  if (typeof score !== 'number' || Number.isNaN(score)) return 'unknown'
  if (score >= 7.5) return 'positive'
  if (score >= 5) return 'mixed'
  return 'negative'
}

export function formatMetascore(score: number | undefined): string {
  if (typeof score !== 'number' || Number.isNaN(score)) return '–'
  return Math.round(score).toString()
}

export function formatUserScore(score: number | undefined): string {
  if (typeof score !== 'number' || Number.isNaN(score)) return '–'
  return score.toFixed(1)
}

export function hasAnyScore(rating: MetacriticRating | undefined): boolean {
  if (!rating) return false
  return typeof rating.metascore === 'number' || typeof rating.userScore === 'number'
}
