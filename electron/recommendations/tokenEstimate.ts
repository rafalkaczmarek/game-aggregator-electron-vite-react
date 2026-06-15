/** Conservative chars-per-token heuristic (Polish + game titles). */
const CHARS_PER_TOKEN = 3.5

export const GITHUB_MODELS_INPUT_TOKEN_LIMIT = 8000

/** Leave headroom for JSON framing and response_format metadata. */
export const GITHUB_MODELS_PROMPT_TOKEN_BUDGET = 7200

export function estimateTokens(text: string): number {
  if (!text.length) return 0
  return Math.ceil(text.length / CHARS_PER_TOKEN)
}

export interface PromptBuildLimits {
  maxPlayed: number
}

export interface PromptTokenStats {
  systemTokens: number
  userTokens: number
  requestBodyTokens: number
  totalInputTokens: number
  limit: number
  withinBudget: boolean
  playedIncluded: number
  playedOmitted: number
  unplayedIncluded: number
  unplayedOmitted: number
  ownedTitleCount: number
}

export function estimateMessagesTokens(
  systemMessage: string,
  userMessage: string,
  requestBodyJson?: string,
): Pick<
  PromptTokenStats,
  'systemTokens' | 'userTokens' | 'requestBodyTokens' | 'totalInputTokens'
> {
  const systemTokens = estimateTokens(systemMessage)
  const userTokens = estimateTokens(userMessage)
  const requestBodyTokens = requestBodyJson
    ? estimateTokens(requestBodyJson)
    : systemTokens + userTokens + 80

  return {
    systemTokens,
    userTokens,
    requestBodyTokens,
    totalInputTokens: requestBodyTokens,
  }
}

export function logPromptTokenStats(stats: PromptTokenStats, model: string): void {
  console.info('[recommendations] GitHub Models request token estimate', {
    model,
    limit: stats.limit,
    requestBodyTokens: stats.requestBodyTokens,
    withinBudget: stats.withinBudget,
    systemTokens: stats.systemTokens,
    userTokens: stats.userTokens,
    playedIncluded: stats.playedIncluded,
    playedOmitted: stats.playedOmitted,
    unplayedIncluded: stats.unplayedIncluded,
    unplayedOmitted: stats.unplayedOmitted,
    ownedTitleCount: stats.ownedTitleCount,
  })
}
