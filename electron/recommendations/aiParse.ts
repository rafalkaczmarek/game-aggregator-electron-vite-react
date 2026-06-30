export interface AiRecommendationItem {
  title: string
  reason: string
}

export interface AiRecommendationsRequestOptions {
  userMessage?: string
}

export interface AiRecommendationsClient {
  requestRecommendations: (
    snapshot: import('./librarySnapshot').LibrarySnapshot,
    options?: AiRecommendationsRequestOptions,
  ) => Promise<AiRecommendationItem[]>
}

interface AiRecommendationResponse {
  recommendations?: AiRecommendationItem[]
  owned?: AiRecommendationItem[]
  discover?: AiRecommendationItem[]
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
