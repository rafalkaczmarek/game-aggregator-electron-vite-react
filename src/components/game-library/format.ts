import type { Game, GamePlatform } from '@shared/types/game'
import { GAME_PLATFORMS } from '@shared/types/game'

export const PLATFORM_LABELS: Record<GamePlatform, string> = {
  steam: 'Steam',
  gog: 'GOG',
  epic: 'Epic',
  psn: 'PSN',
}

export interface GroupedGame {
  key: string
  title: string
  platforms: GamePlatform[]
  entries: Game[]
}

export function formatPlaytime(minutes?: number): string {
  if (minutes == null || minutes <= 0) return 'Not played'
  if (minutes < 60) return `${minutes} min`
  const hours = minutes / 60
  return hours >= 10 ? `${Math.round(hours)} hrs` : `${hours.toFixed(1)} hrs`
}

const TRADEMARK_PATTERN = /[\u2122\u00AE\u00A9\u2120]/g

export function normalizeTitleCharacters(title: string): string {
  return title
    .replace(/[\u2018\u2019\u201A\u2032`´]/g, "'")
    .replace(/[\u201C\u201D\u201E\u2033]/g, '"')
    .replace(TRADEMARK_PATTERN, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeGameTitle(title: string): string {
  return normalizeTitleCharacters(title).replace(/:/g, '').toLocaleLowerCase()
}

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

export function filterGamesByPlatforms(games: Game[], platforms: readonly GamePlatform[]): Game[] {
  if (platforms.length === 0) return games
  const allowed = new Set(platforms)
  return games.filter((game) => allowed.has(game.platform))
}
