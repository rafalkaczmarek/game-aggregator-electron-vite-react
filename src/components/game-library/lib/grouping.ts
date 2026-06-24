import type { Game, GamePlatform, MetacriticRating } from '@shared/types/game'
import { GAME_PLATFORMS } from '@shared/types/game'
import { normalizeGameTitle, normalizeTitleCharacters } from './titleNormalization'
import type { GroupedGame } from './types'

function pickDisplayTitle(entries: Game[]): string {
  const withCover = entries.find((entry) => entry.coverUrl)
  const raw =
    withCover?.title ??
    entries.reduce(
      (best, entry) => (entry.title.length > best.length ? entry.title : best),
      entries[0].title,
    )

  return normalizeTitleCharacters(raw)
}

function sortPlatforms(platforms: GamePlatform[]): GamePlatform[] {
  return [...platforms].sort((a, b) => GAME_PLATFORMS.indexOf(a) - GAME_PLATFORMS.indexOf(b))
}

export function groupGamesByTitle(games: Game[]): GroupedGame[] {
  const groups = new Map<string, GroupedGame>()

  for (const game of games) {
    const key = normalizeGameTitle(game.title)
    const existing = groups.get(key)

    if (existing) {
      existing.entries.push(game)
      if (!existing.platforms.includes(game.platform)) {
        existing.platforms.push(game.platform)
      }
      existing.title = pickDisplayTitle(existing.entries)
      existing.platforms = sortPlatforms(existing.platforms)
      continue
    }

    groups.set(key, {
      key,
      title: normalizeTitleCharacters(game.title),
      platforms: [game.platform],
      entries: [game],
    })
  }

  return [...groups.values()]
}

export function getGroupedGameCoverGame(group: GroupedGame): Game {
  return group.entries.find((entry) => entry.coverUrl) ?? group.entries[0]
}

export function getGroupedGamePlaytime(group: GroupedGame): number | undefined {
  const total = group.entries.reduce((sum, entry) => sum + (entry.playtimeMinutes ?? 0), 0)
  return total > 0 ? total : undefined
}

export function isGroupedGameInstalled(group: GroupedGame): boolean {
  return group.entries.some((entry) => entry.installed)
}

export function isGroupedGamePlayed(group: GroupedGame): boolean {
  return getGroupedGamePlaytime(group) != null
}

/**
 * Picks a single Metacritic rating to represent a grouped game.
 * Prefers the entry with the highest `metascore`; falls back to the highest `userScore`
 * when no metascore is available. Returns `undefined` when no entry has any rating.
 */
export function getGroupedGameMetacritic(group: GroupedGame): MetacriticRating | undefined {
  const ratings = group.entries
    .map((entry) => entry.metacritic)
    .filter((rating): rating is MetacriticRating => rating != null)

  if (ratings.length === 0) return undefined

  const withMetascore = ratings.filter((rating) => typeof rating.metascore === 'number')
  if (withMetascore.length > 0) {
    return withMetascore.reduce((best, current) =>
      (current.metascore ?? -Infinity) > (best.metascore ?? -Infinity) ? current : best,
    )
  }

  const withUserScore = ratings.filter((rating) => typeof rating.userScore === 'number')
  if (withUserScore.length > 0) {
    return withUserScore.reduce((best, current) =>
      (current.userScore ?? -Infinity) > (best.userScore ?? -Infinity) ? current : best,
    )
  }

  return ratings[0]
}
