import type { AggregatedLibrary } from '../../shared/types/game'
import type { RecommendationsResult } from '../../shared/types/recommendations'
import { createScopedLogger } from '../lib/logger'
import { buildLibrarySnapshot, createGitHubModelsRecommendationsClient, getAiRecommendations } from './ai'

const logger = createScopedLogger('recommendations')

export async function getRecommendations(
  library: AggregatedLibrary,
  pat: string | undefined,
): Promise<RecommendationsResult> {
  if (!pat) {
    logger.warn('GitHub PAT not configured')
    return {
      owned: [],
      discover: [],
      errors: [
        'Brak tokenu GitHub PAT — dodaj go w Ustawieniach (GitHub Models), aby wygenerować rekomendacje.',
      ],
      basedOnPlayedCount: 0,
    }
  }

  const snapshot = buildLibrarySnapshot(library.games)

  if (snapshot.played.length === 0) {
    logger.warn('No played games in library snapshot')
    return {
      owned: [],
      discover: [],
      errors: ['Brak gier z czasem gry — zagraj w kilka tytułów, aby wygenerować rekomendacje.'],
      basedOnPlayedCount: 0,
    }
  }

  try {
    logger.info('Requesting AI recommendations', {
      playedCount: snapshot.played.length,
      unplayedCount: snapshot.unplayed.length,
    })
    const client = createGitHubModelsRecommendationsClient(pat)
    const { owned, discover, errors } = await getAiRecommendations(snapshot, client)

    if (owned.length === 0 && snapshot.unplayed.length > 0) {
      errors.push(
        'Żadna propozycja AI nie pasuje do niezagranych gier w Twojej bibliotece — sekcja „Do odkrycia” może nadal zawierać trafne tytuły.',
      )
    }
    if (discover.length === 0) {
      errors.push('AI nie zaproponowało gier spoza biblioteki — spróbuj ponownie.')
    }

    logger.info('AI recommendations received', {
      ownedCount: owned.length,
      discoverCount: discover.length,
      errorCount: errors.length,
    })

    return {
      owned,
      discover,
      errors,
      basedOnPlayedCount: snapshot.played.length,
    }
  } catch (error) {
    logger.error('AI recommendations failed', error)
    return {
      owned: [],
      discover: [],
      errors: [
        error instanceof Error
          ? error.message
          : 'Nie udało się wygenerować rekomendacji AI.',
      ],
      basedOnPlayedCount: snapshot.played.length,
    }
  }
}
