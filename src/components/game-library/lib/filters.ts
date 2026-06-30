import type { Game, GamePlatform } from '@shared/types/game'
import { isGroupedGamePlayed } from './grouping'
import { normalizeGameTitle } from './titleNormalization'
import type { GroupedGame, PlayStatusFilter } from './types'

export function filterGamesByPlatforms(games: Game[], platforms: readonly GamePlatform[]): Game[] {
  if (platforms.length === 0) return games
  const allowed = new Set(platforms)
  return games.filter((game) => allowed.has(game.platform))
}

export function filterGroupedGamesByPlayStatus(
  groups: GroupedGame[],
  status: PlayStatusFilter,
): GroupedGame[] {
  if (status === 'all') return groups
  if (status === 'played') return groups.filter(isGroupedGamePlayed)
  return groups.filter((group) => !isGroupedGamePlayed(group))
}

export function filterGroupedGamesBySearchQuery(
  groups: GroupedGame[],
  query: string,
): GroupedGame[] {
  const trimmed = query.trim()
  if (!trimmed) return groups

  const normalizedQuery = normalizeGameTitle(trimmed)
  return groups.filter((group) => group.key.includes(normalizedQuery))
}
