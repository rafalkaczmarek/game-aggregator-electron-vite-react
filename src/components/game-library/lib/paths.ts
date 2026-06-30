import type { GroupedGame } from './types'

export function gameDetailPath(game: GroupedGame): string {
  return `/library/${encodeURIComponent(game.key)}`
}
