import type {
  AggregatedLibrary,
  Game,
  MetacriticRating,
  ScanResult,
} from '../../../shared/types/game'
import { createScopedLogger } from '../../lib/logger'
import { fetchGameDetails, searchGames, type SearchHit } from './api'
import { getCached, setCached } from './cache'
import { METACRITIC_PLATFORM_CANDIDATES } from './platforms'
import { cacheKey, slugifyTitle } from './slug'

const logger = createScopedLogger('metacritic:enrich')

/** Max parallel HTTP requests to Metacritic — be a polite citizen of an unofficial endpoint. */
const CONCURRENCY = 2

/** Soft delay between successive requests (per worker) to spread load. */
const REQUEST_DELAY_MS = 250

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function normalizedTitle(title: string): string {
  return title.trim().toLocaleLowerCase().replace(/[\u2018\u2019`´']/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
}

function platformMatches(hit: SearchHit, candidate: string): boolean {
  if (hit.platforms.length === 0) return true
  const normalizedCandidate = candidate.replace(/-/g, ' ')
  return hit.platforms.some((name) => name.toLocaleLowerCase().includes(normalizedCandidate))
}

function pickBestSearchHit(query: string, hits: SearchHit[], candidate: string): SearchHit | null {
  if (hits.length === 0) return null
  const normalizedQuery = normalizedTitle(query)

  const exactMatchOnPlatform = hits.find(
    (hit) => normalizedTitle(hit.title) === normalizedQuery && platformMatches(hit, candidate),
  )
  if (exactMatchOnPlatform) return exactMatchOnPlatform

  const onPlatform = hits.find((hit) => platformMatches(hit, candidate))
  if (onPlatform) return onPlatform

  return hits[0]
}

/**
 * Resolves a Metacritic rating for a single (title, platform-candidate) pair.
 * Returns `null` when nothing was found (also persisted as a short-lived "negative" cache entry).
 */
async function resolveRating(
  title: string,
  candidate: string,
): Promise<MetacriticRating | null> {
  const key = cacheKey(title, candidate)
  const cached = await getCached(key)
  if (cached !== undefined) return cached

  const guessSlug = slugifyTitle(title)
  let details = guessSlug ? await fetchGameDetails(guessSlug) : null

  if (!details || (details.metascore === undefined && details.userScore === undefined)) {
    const hits = await searchGames(title)
    const hit = pickBestSearchHit(title, hits, candidate)
    if (hit) {
      const detailFromSearch = await fetchGameDetails(hit.slug)
      if (detailFromSearch) {
        details = detailFromSearch
      } else if (hit.metascore !== undefined || hit.userScore !== undefined) {
        details = {
          slug: hit.slug,
          title: hit.title,
          metascore: hit.metascore,
          userScore: hit.userScore,
          url: hit.url ? `https://www.metacritic.com${hit.url}` : undefined,
        }
      }
    }
  }

  if (!details) {
    await setCached(key, null)
    return null
  }

  const rating: MetacriticRating = {
    metascore: details.metascore,
    userScore: details.userScore,
    url: details.url,
    platform: candidate,
    fetchedAt: new Date().toISOString(),
  }

  if (rating.metascore === undefined && rating.userScore === undefined) {
    await setCached(key, null)
    return null
  }

  await setCached(key, rating)
  return rating
}

/** Tries each platform candidate in order; returns the first non-null rating. */
async function resolveForGame(game: Game): Promise<MetacriticRating | null> {
  const candidates = METACRITIC_PLATFORM_CANDIDATES[game.platform]
  for (const candidate of candidates) {
    const rating = await resolveRating(game.title, candidate)
    if (rating) return rating
    await sleep(REQUEST_DELAY_MS)
  }
  return null
}

/**
 * Groups games by normalized title to avoid re-fetching the same title across platforms.
 * Returns a list of (representativeTitle, gameIds) tuples.
 */
function groupGamesByTitle(games: Game[]): Map<string, Game[]> {
  const groups = new Map<string, Game[]>()
  for (const game of games) {
    const key = `${game.platform}:${slugifyTitle(game.title)}`
    const existing = groups.get(key)
    if (existing) {
      existing.push(game)
    } else {
      groups.set(key, [game])
    }
  }
  return groups
}

/**
 * Enriches every game in `library` with a `metacritic` rating where available.
 * Returns a NEW library object with updated `games` (and matching entries in `results`).
 * Best-effort: errors and missing data never throw; the original game is returned unchanged.
 */
export async function enrichLibraryWithMetacritic(
  library: AggregatedLibrary,
): Promise<AggregatedLibrary> {
  const startedAt = performance.now()
  const groups = [...groupGamesByTitle(library.games).values()]
  const ratingsByGameId = new Map<string, MetacriticRating>()

  let workerErrors = 0
  let cursor = 0

  async function worker(): Promise<void> {
    while (cursor < groups.length) {
      const index = cursor++
      const group = groups[index]
      const representative = group[0]
      try {
        const rating = await resolveForGame(representative)
        if (rating) {
          for (const game of group) {
            ratingsByGameId.set(game.id, rating)
          }
        }
      } catch (error) {
        workerErrors += 1
        logger.debug('Worker error while resolving rating', {
          title: representative.title,
          platform: representative.platform,
          error: error instanceof Error ? error.message : String(error),
        })
      }
      await sleep(REQUEST_DELAY_MS)
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()))

  const enrichedGames = library.games.map((game) => {
    const rating = ratingsByGameId.get(game.id)
    return rating ? { ...game, metacritic: rating } : game
  })

  const enrichedResults: ScanResult[] = library.results.map((result) => ({
    ...result,
    games: result.games.map((game) => {
      const rating = ratingsByGameId.get(game.id)
      return rating ? { ...game, metacritic: rating } : game
    }),
  }))

  const durationMs = Math.round(performance.now() - startedAt)
  logger.info('Metacritic enrichment finished', {
    durationMs,
    enriched: ratingsByGameId.size,
    total: library.games.length,
    workerErrors,
  })

  return { ...library, games: enrichedGames, results: enrichedResults }
}
