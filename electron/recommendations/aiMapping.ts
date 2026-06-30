import type { GameRecommendation } from '../../shared/types/recommendations'
import type { AiRecommendationItem } from './aiParse'
import {
  findLibraryMatch,
  isOwnedTitle,
  type LibrarySnapshot,
} from './librarySnapshot'
import { DISCOVER_LIMIT, OWNED_LIMIT } from './prompt'

export function mapAiRecommendations(
  items: AiRecommendationItem[],
  snapshot: LibrarySnapshot,
): { owned: GameRecommendation[]; discover: GameRecommendation[]; errors: string[] } {
  const errors: string[] = []
  const owned: GameRecommendation[] = []
  const discover: GameRecommendation[] = []
  const seen = new Set<string>()

  for (const item of items) {
    const key = item.title.toLocaleLowerCase()
    if (seen.has(key)) continue
    seen.add(key)

    const libraryMatch = findLibraryMatch(item.title, snapshot)

    if (libraryMatch) {
      if (libraryMatch.playtimeMinutes > 0) {
        continue
      }

      if (owned.length >= OWNED_LIMIT) continue

      owned.push({
        title: libraryMatch.title,
        reason: item.reason,
        source: 'owned',
        platform: libraryMatch.platforms[0],
        coverUrl: libraryMatch.coverUrl,
      })
      continue
    }

    if (discover.length >= DISCOVER_LIMIT) continue

    if (isOwnedTitle(item.title, snapshot.ownedTitles)) {
      errors.push(`Pominięto "${item.title}" — tytuł jest w bibliotece, ale nie udało się go dopasować.`)
      continue
    }

    discover.push({
      title: item.title,
      reason: item.reason,
      source: 'discover',
    })
  }

  return { owned, discover, errors }
}
