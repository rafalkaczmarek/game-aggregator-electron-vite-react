import type { Game } from '@shared/types/game'
import type { GroupedGame } from './types'

export function sortGamesByTitle(games: Game[]): Game[] {
  return [...games].sort((a, b) =>
    a.title.trim().localeCompare(b.title.trim(), undefined, { sensitivity: 'base' }),
  )
}

export function sortGroupedGamesByTitle(groups: GroupedGame[]): GroupedGame[] {
  return [...groups].sort((a, b) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }),
  )
}
