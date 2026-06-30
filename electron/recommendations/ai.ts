import type { GameRecommendation } from '../../shared/types/recommendations'
import { mapAiRecommendations } from './aiMapping'
import type { AiRecommendationsClient, AiRecommendationsRequestOptions } from './aiParse'
import { buildLibrarySnapshot } from './librarySnapshot'
import type { LibrarySnapshot } from './librarySnapshot'
import { createGitHubModelsRecommendationsClient } from './githubModelsClient'
import { DISCOVER_LIMIT, OWNED_LIMIT } from './prompt'

export type { AiRecommendationsClient, AiRecommendationsRequestOptions } from './aiParse'
export { parseAiRecommendationsJson } from './aiParse'
export { mapAiRecommendations } from './aiMapping'
export { createGitHubModelsRecommendationsClient } from './githubModelsClient'

export async function getAiRecommendations(
  snapshot: LibrarySnapshot,
  client: AiRecommendationsClient,
  options?: AiRecommendationsRequestOptions,
): Promise<{ owned: GameRecommendation[]; discover: GameRecommendation[]; errors: string[] }> {
  const items = await client.requestRecommendations(snapshot, options)
  return mapAiRecommendations(items, snapshot)
}

export { buildLibrarySnapshot, OWNED_LIMIT, DISCOVER_LIMIT }
