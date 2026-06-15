import type { GameRecommendation } from '../../shared/types/recommendations'
import {
  buildLibrarySnapshot,
  findLibraryMatch,
  isOwnedTitle,
  type LibrarySnapshot,
} from './librarySnapshot'
import {
  DISCOVER_LIMIT,
  OWNED_LIMIT,
  SYSTEM_MESSAGE,
  buildPromptWithinTokenBudget,
} from './prompt'

const GITHUB_MODELS_URL = 'https://models.github.ai/inference/chat/completions'
const GITHUB_API_VERSION = '2022-11-28'
const DEFAULT_MODEL = 'openai/gpt-4.1-mini'

interface AiRecommendationItem {
  title: string
  reason: string
}

interface AiRecommendationResponse {
  recommendations?: AiRecommendationItem[]
  owned?: AiRecommendationItem[]
  discover?: AiRecommendationItem[]
}

export interface AiRecommendationsClient {
  requestRecommendations: (snapshot: LibrarySnapshot) => Promise<AiRecommendationItem[]>
}

function extractJsonContent(content: string): string {
  const trimmed = content.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  return fenced?.[1]?.trim() ?? trimmed
}

function normalizeItems(items: unknown[]): AiRecommendationItem[] {
  return items
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const row = item as Record<string, unknown>
      const title = typeof row.title === 'string' ? row.title.trim() : ''
      const reason = typeof row.reason === 'string' ? row.reason.trim() : ''
      if (!title || !reason) return null
      return { title, reason }
    })
    .filter((item): item is AiRecommendationItem => item !== null)
}

export function parseAiRecommendationsJson(content: string): AiRecommendationItem[] {
  let payload: unknown
  try {
    payload = JSON.parse(extractJsonContent(content))
  } catch {
    throw new Error('Model AI zwrócił niepoprawny JSON.')
  }

  if (!payload || typeof payload !== 'object') {
    throw new Error('Model AI zwrócił pustą odpowiedź.')
  }

  const record = payload as AiRecommendationResponse
  if (Array.isArray(record.recommendations) && record.recommendations.length > 0) {
    return normalizeItems(record.recommendations)
  }

  return normalizeItems([...(record.owned ?? []), ...(record.discover ?? [])])
}

export function createGitHubModelsRecommendationsClient(pat: string): AiRecommendationsClient {
  const model = process.env.GITHUB_MODELS_MODEL?.trim() || DEFAULT_MODEL

  return {
    async requestRecommendations(snapshot) {
      const { userPrompt, stats } = buildPromptWithinTokenBudget(snapshot, model)

      const response = await fetch(GITHUB_MODELS_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${pat}`,
          'X-GitHub-Api-Version': GITHUB_API_VERSION,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          temperature: 0.7,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: SYSTEM_MESSAGE },
            { role: 'user', content: userPrompt },
          ],
        }),
      })

      if (!response.ok) {
        const body = await response.text()
        throw new Error(
          `GitHub Models API error ${response.status}: ${body.slice(0, 240) || response.statusText} (szac. ${stats.requestBodyTokens} tokenów, limit ${stats.limit})`,
        )
      }

      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>
        error?: { message?: string }
      }

      if (payload.error?.message) {
        throw new Error(`GitHub Models: ${payload.error.message}`)
      }

      const content = payload.choices?.[0]?.message?.content
      if (!content) {
        throw new Error('GitHub Models nie zwróciło treści odpowiedzi.')
      }

      return parseAiRecommendationsJson(content)
    },
  }
}

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

export async function getAiRecommendations(
  snapshot: LibrarySnapshot,
  client: AiRecommendationsClient,
): Promise<{ owned: GameRecommendation[]; discover: GameRecommendation[]; errors: string[] }> {
  const items = await client.requestRecommendations(snapshot)
  return mapAiRecommendations(items, snapshot)
}

export { buildLibrarySnapshot, OWNED_LIMIT, DISCOVER_LIMIT }
