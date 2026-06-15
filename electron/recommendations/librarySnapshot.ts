import type { Game } from '../../shared/types/game'

export interface PlayedSnapshotEntry {
  title: string
  playtimeMinutes: number
  platforms: Game['platform'][]
}

export interface UnplayedSnapshotEntry {
  title: string
  platforms: Game['platform'][]
  coverUrl?: string
}

export interface LibrarySnapshot {
  played: PlayedSnapshotEntry[]
  unplayed: UnplayedSnapshotEntry[]
  ownedTitles: string[]
}

function normalizeTitleKey(title: string): string {
  return title
    .trim()
    .toLocaleLowerCase()
    .replace(/[\u2018\u2019`´]/g, "'")
    .replace(/:/g, '')
}

function sortPlatforms(platforms: Game['platform'][]): Game['platform'][] {
  return [...new Set(platforms)]
}

export function buildLibrarySnapshot(games: Game[]): LibrarySnapshot {
  const playedGroups = new Map<string, PlayedSnapshotEntry>()
  const unplayedGroups = new Map<string, UnplayedSnapshotEntry>()
  const ownedTitles = new Set<string>()

  for (const game of games) {
    ownedTitles.add(game.title.trim())
    const key = normalizeTitleKey(game.title)
    const playtime = game.playtimeMinutes ?? 0

    if (playtime > 0) {
      const existing = playedGroups.get(key)
      if (existing) {
        existing.playtimeMinutes += playtime
        if (!existing.platforms.includes(game.platform)) {
          existing.platforms.push(game.platform)
        }
        continue
      }

      playedGroups.set(key, {
        title: game.title,
        playtimeMinutes: playtime,
        platforms: [game.platform],
      })
      continue
    }

    const existingUnplayed = unplayedGroups.get(key)
    if (existingUnplayed) {
      if (!existingUnplayed.platforms.includes(game.platform)) {
        existingUnplayed.platforms.push(game.platform)
      }
      if (!existingUnplayed.coverUrl && game.coverUrl) {
        existingUnplayed.coverUrl = game.coverUrl
      }
      continue
    }

    unplayedGroups.set(key, {
      title: game.title,
      platforms: [game.platform],
      coverUrl: game.coverUrl,
    })
  }

  const played = [...playedGroups.values()]
    .sort((a, b) => b.playtimeMinutes - a.playtimeMinutes)
    .map((entry) => ({ ...entry, platforms: sortPlatforms(entry.platforms) }))

  const unplayed = [...unplayedGroups.values()]
    .sort((a, b) => a.title.localeCompare(b.title, 'pl'))
    .map((entry) => ({ ...entry, platforms: sortPlatforms(entry.platforms) }))

  return {
    played,
    unplayed,
    ownedTitles: [...ownedTitles].sort((a, b) => a.localeCompare(b, 'pl')),
  }
}

export function findUnplayedMatch(
  title: string,
  unplayed: UnplayedSnapshotEntry[],
): UnplayedSnapshotEntry | undefined {
  return findEntryByTitle(title, unplayed)
}

function findEntryByTitle<T extends { title: string }>(
  title: string,
  entries: T[],
): T | undefined {
  const key = normalizeTitleKey(title)
  const exact = entries.find((entry) => normalizeTitleKey(entry.title) === key)
  if (exact) return exact

  return entries.find((entry) => {
    const entryKey = normalizeTitleKey(entry.title)
    return entryKey.includes(key) || key.includes(entryKey)
  })
}

export interface LibraryMatch {
  title: string
  platforms: Game['platform'][]
  coverUrl?: string
  playtimeMinutes: number
}

export function findLibraryMatch(
  title: string,
  snapshot: LibrarySnapshot,
): LibraryMatch | undefined {
  const unplayed = findEntryByTitle(title, snapshot.unplayed)
  if (unplayed) {
    return {
      title: unplayed.title,
      platforms: unplayed.platforms,
      coverUrl: unplayed.coverUrl,
      playtimeMinutes: 0,
    }
  }

  const played = findEntryByTitle(title, snapshot.played)
  if (played) {
    return {
      title: played.title,
      platforms: played.platforms,
      playtimeMinutes: played.playtimeMinutes,
    }
  }

  return undefined
}

export function isOwnedTitle(title: string, ownedTitles: string[]): boolean {
  const key = normalizeTitleKey(title)
  return ownedTitles.some((owned) => {
    const ownedKey = normalizeTitleKey(owned)
    return ownedKey === key || ownedKey.includes(key) || key.includes(ownedKey)
  })
}

export { normalizeTitleKey }
