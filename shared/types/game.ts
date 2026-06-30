export const GAME_PLATFORMS = ['steam', 'gog', 'epic', 'psn'] as const

export type GamePlatform = (typeof GAME_PLATFORMS)[number]

export interface MetacriticRating {
  /** Critic Metascore (0-100). */
  metascore?: number
  /** Aggregated user score (0-10). */
  userScore?: number
  /** Direct Metacritic page URL. */
  url?: string
  /** Metacritic platform slug used to fetch the rating (e.g. `pc`, `playstation-5`). */
  platform?: string
  /** ISO timestamp of when the rating was fetched (used for cache TTL). */
  fetchedAt?: string
}

export interface Game {
  /** Unique within a single platform (e.g. steam appid). */
  id: string
  platform: GamePlatform
  title: string
  coverUrl?: string
  playtimeMinutes?: number
  installed: boolean
  /** Platform-native identifier (Steam appId, PSN titleId, …). */
  sourceId?: string
  /** Best-effort Metacritic rating, populated by the metadata enrichment pipeline. */
  metacritic?: MetacriticRating
}

export interface ScanResult {
  platform: GamePlatform
  games: Game[]
  errors: string[]
}

export interface AggregatedLibrary {
  games: Game[]
  scannedAt: string
  results: ScanResult[]
}

/** Progress payload pushed from main process while Metacritic enrichment runs. */
export interface MetacriticEnrichmentProgress {
  done: number
  total: number
  enriched: number
}

/** Summary payload when Metacritic enrichment completes. */
export interface MetacriticEnrichmentFinished {
  done: number
  total: number
  enriched: number
  durationMs: number
}

/** Incremental rating update pushed while Metacritic enrichment runs. */
export interface MetacriticRatingUpdate {
  gameId: string
  rating: MetacriticRating
}

export interface GameDescription {
  text: string
  source: 'steam'
}

export interface GameDescriptionRequest {
  platform: GamePlatform
  sourceId?: string
}

export interface GameApi {
  getLibrary: () => Promise<AggregatedLibrary | null>
  scanAll: () => Promise<AggregatedLibrary>
  enrichMetacritic: () => Promise<{ started: true }>
  scanPlatform: (platform: GamePlatform) => Promise<ScanResult>
  getGameDescription: (request: GameDescriptionRequest) => Promise<GameDescription | null>
  getRecommendations: (
    options?: import('./recommendations').RecommendationsOptions,
  ) => Promise<import('./recommendations').RecommendationsResult>
}
