import type { LibrarySnapshot } from './librarySnapshot'
import { parseAiRecommendationsJson } from './aiParse'
import type { AiRecommendationsClient, AiRecommendationsRequestOptions } from './aiParse'
import { SYSTEM_MESSAGE, buildPromptWithinTokenBudget } from './prompt'

const GITHUB_MODELS_URL = 'https://models.github.ai/inference/chat/completions'
const GITHUB_API_VERSION = '2022-11-28'
const DEFAULT_MODEL = 'openai/gpt-4.1-mini'

export function createGitHubModelsRecommendationsClient(pat: string): AiRecommendationsClient {
  const model = process.env.GITHUB_MODELS_MODEL?.trim() || DEFAULT_MODEL

  return {
    async requestRecommendations(snapshot, options) {
      const { userPrompt, stats } = buildPromptWithinTokenBudget(
        snapshot,
        model,
        options?.userMessage,
      )

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

export type { AiRecommendationsClient, AiRecommendationsRequestOptions }
