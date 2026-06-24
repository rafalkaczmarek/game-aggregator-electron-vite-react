import type { Game, GamePlatform } from '@shared/types/game'

export interface GroupedGame {
  key: string
  title: string
  platforms: GamePlatform[]
  entries: Game[]
}

export type PlayStatusFilter = 'all' | 'played' | 'unplayed'

export type LibrarySort = 'title' | 'playtime-desc' | 'playtime-asc' | 'metacritic-desc' | 'metacritic-asc'
