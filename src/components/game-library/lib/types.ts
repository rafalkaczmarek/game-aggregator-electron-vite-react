import type { Game, GamePlatform } from '@shared/types/game'

export interface GroupedGame {
  key: string
  title: string
  platforms: GamePlatform[]
  entries: Game[]
}

export type PlayStatusFilter = 'all' | 'played' | 'unplayed'
