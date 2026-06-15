export const GAME_PLATFORMS = ['steam', 'gog', 'epic', 'psn'] as const

export type GamePlatform = (typeof GAME_PLATFORMS)[number]

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

export interface GameApi {
  getLibrary: () => Promise<AggregatedLibrary | null>
  scanAll: () => Promise<AggregatedLibrary>
  scanPlatform: (platform: GamePlatform) => Promise<ScanResult>
  getRecommendations: () => Promise<import('./recommendations').RecommendationsResult>
}
