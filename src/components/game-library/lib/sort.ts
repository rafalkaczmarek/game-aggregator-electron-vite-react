import type { Game } from '@shared/types/game'
import { getGroupedGameMetacriticSortScore, getGroupedGamePlaytime } from './grouping'
import type { GroupedGame, LibrarySort } from './types'

function compareTitles(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: 'base' })
}

function getGroupPlaytimeMinutes(group: GroupedGame): number {
  return getGroupedGamePlaytime(group) ?? 0
}

function getGroupMetacriticScore(group: GroupedGame): number | undefined {
  return getGroupedGameMetacriticSortScore(group)
}

export function sortGamesByTitle(games: Game[]): Game[] {
  return [...games].sort((a, b) => compareTitles(a.title.trim(), b.title.trim()))
}

export function sortGroupedGamesByTitle(groups: GroupedGame[]): GroupedGame[] {
  return [...groups].sort((a, b) => compareTitles(a.title, b.title))
}

export function sortGroupedGames(groups: GroupedGame[], sort: LibrarySort): GroupedGame[] {
  const sorted = [...groups]

  if (sort === 'title') {
    return sortGroupedGamesByTitle(sorted)
  }

  if (sort === 'playtime-desc') {
    return sorted.sort((a, b) => {
      const diff = getGroupPlaytimeMinutes(b) - getGroupPlaytimeMinutes(a)
      return diff !== 0 ? diff : compareTitles(a.title, b.title)
    })
  }

  if (sort === 'playtime-asc') {
    return sorted.sort((a, b) => {
      const diff = getGroupPlaytimeMinutes(a) - getGroupPlaytimeMinutes(b)
      return diff !== 0 ? diff : compareTitles(a.title, b.title)
    })
  }

  if (sort === 'metacritic-desc') {
    return sorted.sort((a, b) => {
      const diff = (getGroupMetacriticScore(b) ?? -1) - (getGroupMetacriticScore(a) ?? -1)
      return diff !== 0 ? diff : compareTitles(a.title, b.title)
    })
  }

  return sorted.sort((a, b) => {
    const diff = (getGroupMetacriticScore(a) ?? Infinity) - (getGroupMetacriticScore(b) ?? Infinity)
    return diff !== 0 ? diff : compareTitles(a.title, b.title)
  })
}
