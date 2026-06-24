import { createScopedLogger } from '../../lib/logger'

const logger = createScopedLogger('metacritic:api')

const BACKEND_BASE = 'https://backend.metacritic.com'

/**
 * Public Metacritic frontend API key. Embedded in their site bundle and visible in any browser
 * DevTools Network tab. It is NOT a secret credential — Metacritic itself ships it in plaintext
 * to every visitor. Override via `METACRITIC_API_KEY` env var if Metacritic ever rotates it.
 */
const DEFAULT_API_KEY = '1MOZgmNFxvmljaQR1X9KAij9Mo4xAY3u'

const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Referer: 'https://www.metacritic.com/',
  Origin: 'https://www.metacritic.com',
  Accept: 'application/json',
}

/** Games on Metacritic — used as `mcoTypeId` for filtering search results. */
const SEARCH_GAME_TYPE_ID = '13'

const REQUEST_TIMEOUT_MS = 8000

function getApiKey(): string {
  return process.env.METACRITIC_API_KEY?.trim() || DEFAULT_API_KEY
}

async function fetchJson<T>(url: string): Promise<T | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      headers: BROWSER_HEADERS,
      signal: controller.signal,
    })
    if (!response.ok) {
      logger.debug('Metacritic responded with non-2xx', { url, status: response.status })
      return null
    }
    return (await response.json()) as T
  } catch (error) {
    logger.debug('Metacritic request failed', {
      url,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  } finally {
    clearTimeout(timer)
  }
}

export interface SearchHit {
  slug: string
  title: string
  platforms: string[]
  metascore?: number
  userScore?: number
  url?: string
}

interface RawSearchItem {
  slug?: unknown
  title?: unknown
  type?: unknown
  platforms?: unknown
  criticScoreSummary?: { score?: unknown; url?: unknown }
  userScoreSummary?: { score?: unknown; url?: unknown }
}

interface RawSearchResponse {
  data?: { items?: RawSearchItem[] }
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

function extractPlatformNames(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => {
      if (entry && typeof entry === 'object') {
        const name = (entry as { name?: unknown }).name
        return typeof name === 'string' ? name : null
      }
      if (typeof entry === 'string') return entry
      return null
    })
    .filter((name): name is string => name !== null)
}

function parseSearchItem(item: RawSearchItem): SearchHit | null {
  const slug = typeof item.slug === 'string' ? item.slug : null
  const title = typeof item.title === 'string' ? item.title : null
  if (!slug || !title) return null

  const metascore = asNumber(item.criticScoreSummary?.score)
  const userScore = asNumber(item.userScoreSummary?.score)
  const url =
    typeof item.criticScoreSummary?.url === 'string' ? item.criticScoreSummary.url : undefined

  return {
    slug,
    title,
    platforms: extractPlatformNames(item.platforms),
    metascore,
    userScore,
    url,
  }
}

/**
 * Searches Metacritic's catalog for games matching `query`. Returns up to `limit` hits.
 * Best-effort: returns `[]` on any failure (network error, schema change, rate limit, …).
 */
export async function searchGames(query: string, limit = 10): Promise<SearchHit[]> {
  const apiKey = getApiKey()
  const url = new URL(
    `${BACKEND_BASE}/finder/metacritic/search/${encodeURIComponent(query)}/web`,
  )
  url.searchParams.set('apiKey', apiKey)
  url.searchParams.set('componentName', 'search-tabs')
  url.searchParams.set('componentDisplayName', 'Search Page Tab Filters')
  url.searchParams.set('componentType', 'FilterConfig')
  url.searchParams.set('mcoTypeId', SEARCH_GAME_TYPE_ID)
  url.searchParams.set('offset', '0')
  url.searchParams.set('limit', String(limit))

  const payload = await fetchJson<RawSearchResponse>(url.toString())
  if (!payload?.data?.items) return []

  return payload.data.items
    .map(parseSearchItem)
    .filter((hit): hit is SearchHit => hit !== null)
}

export interface GameDetails {
  slug: string
  title: string
  metascore?: number
  userScore?: number
  url?: string
}

interface RawComponentItem {
  title?: unknown
  slug?: unknown
  metascore?: unknown
  user_score?: unknown
  userScore?: unknown
  criticScoreSummary?: { score?: unknown; url?: unknown }
  userScoreSummary?: { score?: unknown }
}

interface RawComposerResponse {
  components?: Array<{ data?: { item?: RawComponentItem } }>
}

function findItemWithScore(payload: RawComposerResponse | null): RawComponentItem | null {
  if (!payload?.components) return null
  for (const component of payload.components) {
    const item = component.data?.item
    if (!item) continue
    if (
      asNumber(item.metascore) !== undefined ||
      asNumber(item.user_score) !== undefined ||
      asNumber(item.userScore) !== undefined ||
      asNumber(item.criticScoreSummary?.score) !== undefined ||
      asNumber(item.userScoreSummary?.score) !== undefined ||
      typeof item.slug === 'string'
    ) {
      return item
    }
  }
  return null
}

/**
 * Fetches detailed game data (incl. user score) for a known slug. Returns `null` when the page
 * cannot be parsed (slug missing, schema changed, etc.).
 */
export async function fetchGameDetails(slug: string): Promise<GameDetails | null> {
  const apiKey = getApiKey()
  const url = new URL(`${BACKEND_BASE}/composer/metacritic/pages/games/${slug}/web`)
  url.searchParams.set('filter', 'all')
  url.searchParams.set('sort', 'date')
  url.searchParams.set('apiKey', apiKey)

  const payload = await fetchJson<RawComposerResponse>(url.toString())
  const item = findItemWithScore(payload)
  if (!item) return null

  const title = typeof item.title === 'string' ? item.title : slug
  const finalSlug = typeof item.slug === 'string' ? item.slug : slug
  const metascore = asNumber(item.metascore) ?? asNumber(item.criticScoreSummary?.score)
  const userScore =
    asNumber(item.user_score) ??
    asNumber(item.userScore) ??
    asNumber(item.userScoreSummary?.score)
  const detailUrl =
    typeof item.criticScoreSummary?.url === 'string'
      ? `https://www.metacritic.com${item.criticScoreSummary.url}`
      : `https://www.metacritic.com/game/${finalSlug}/`

  return { slug: finalSlug, title, metascore, userScore, url: detailUrl }
}
