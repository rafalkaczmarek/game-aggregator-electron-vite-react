import type { GamePlatform } from './game'

export type RecommendationSource = 'owned' | 'discover'

export interface GameRecommendation {
  title: string
  reason: string
  source: RecommendationSource
  platform?: GamePlatform
  coverUrl?: string
  /** Steam store app id — useful for discover picks and Steam-owned games. */
  steamAppId?: string
}

export interface RecommendationsResult {
  owned: GameRecommendation[]
  discover: GameRecommendation[]
  errors: string[]
  /** Number of played titles used to build the taste profile. */
  basedOnPlayedCount: number
}

export interface RecommendationsApi {
  getRecommendations: () => Promise<RecommendationsResult>
}
