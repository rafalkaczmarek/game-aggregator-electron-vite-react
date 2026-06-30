import type { LibrarySnapshot } from './librarySnapshot'
import { createScopedLogger } from '../lib/logger'
import { buildUserPreferenceLines } from './promptUserMessage'
import {
  GITHUB_MODELS_INPUT_TOKEN_LIMIT,
  GITHUB_MODELS_PROMPT_TOKEN_BUDGET,
  estimateMessagesTokens,
  estimateTokens,
  logPromptTokenStats,
  type PromptTokenStats,
} from './tokenEstimate'

const logger = createScopedLogger('recommendations')

export const SYSTEM_MESSAGE =
  'Jesteś ekspertem od gier wideo. Odpowiadasz wyłącznie poprawnym JSON-em zgodnym ze schematem podanym przez użytkownika.'

export const OWNED_LIMIT = 5
export const DISCOVER_LIMIT = 5
export const RECOMMENDATION_TOTAL = OWNED_LIMIT + DISCOVER_LIMIT

const MIN_PLAYED = 8

function formatPlaytime(minutes: number): string {
  const hours = minutes / 60
  return hours >= 10 ? `${Math.round(hours)} h` : `${hours.toFixed(1)} h`
}

export function buildUserPrompt(
  snapshot: LibrarySnapshot,
  maxPlayed: number,
  userMessage?: string,
): { prompt: string; playedIncluded: number } {
  const played = snapshot.played.slice(0, maxPlayed)

  const playedLines = played.map(
    (entry) =>
      `- ${entry.title} (${formatPlaytime(entry.playtimeMinutes)}, ${entry.platforms.join('/')})`,
  )

  const preferenceLines = buildUserPreferenceLines(userMessage)

  const prompt = [
    'Jesteś asystentem rekomendacji gier. Znasz wyłącznie gry, w które użytkownik już grał (lista ZAGRANE).',
    `Na tej podstawie zaproponuj dokładnie ${RECOMMENDATION_TOTAL} gier, które mogłyby mu się spodobać.`,
    'Nie powtarzaj tytułów z listy ZAGRANE.',
    'Dla każdej propozycji podaj krótki powód po polsku (1-2 zdania), konkretny i osobisty.',
    'Uwzględnij czas gry — dłuższe sesje ważą więcej przy profilowaniu gustu.',
    ...preferenceLines,
    'Odpowiedz wyłącznie poprawnym JSON bez markdown:',
    '{"recommendations":[{"title":"...","reason":"..."}]}',
    '',
    'ZAGRANE:',
    playedLines.length > 0 ? playedLines.join('\n') : '- brak danych',
  ].join('\n')

  return { prompt, playedIncluded: played.length }
}

function buildRequestBody(model: string, userPrompt: string): string {
  return JSON.stringify({
    model,
    temperature: 0.7,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_MESSAGE },
      { role: 'user', content: userPrompt },
    ],
  })
}

export function buildPromptWithinTokenBudget(
  snapshot: LibrarySnapshot,
  model: string,
  userMessage?: string,
): { userPrompt: string; stats: PromptTokenStats } {
  let maxPlayed = snapshot.played.length

  let built = buildUserPrompt(snapshot, maxPlayed, userMessage)
  let requestBody = buildRequestBody(model, built.prompt)
  let tokenEstimate = estimateMessagesTokens(SYSTEM_MESSAGE, built.prompt, requestBody)

  while (
    tokenEstimate.requestBodyTokens > GITHUB_MODELS_PROMPT_TOKEN_BUDGET &&
    maxPlayed > MIN_PLAYED
  ) {
    maxPlayed = Math.max(MIN_PLAYED, maxPlayed - 10)
    built = buildUserPrompt(snapshot, maxPlayed, userMessage)
    requestBody = buildRequestBody(model, built.prompt)
    tokenEstimate = estimateMessagesTokens(SYSTEM_MESSAGE, built.prompt, requestBody)
  }

  const stats: PromptTokenStats = {
    ...tokenEstimate,
    limit: GITHUB_MODELS_INPUT_TOKEN_LIMIT,
    withinBudget: tokenEstimate.requestBodyTokens <= GITHUB_MODELS_INPUT_TOKEN_LIMIT,
    playedIncluded: built.playedIncluded,
    playedOmitted: Math.max(0, snapshot.played.length - built.playedIncluded),
    unplayedIncluded: 0,
    unplayedOmitted: snapshot.unplayed.length,
    ownedTitleCount: snapshot.ownedTitles.length,
  }

  logPromptTokenStats(stats, model)

  if (!stats.withinBudget) {
    logger.warn(
      `Prompt still exceeds budget (~${stats.requestBodyTokens} est. tokens, limit ${stats.limit}). Request may fail.`,
    )
  }

  if (stats.playedOmitted > 0) {
    logger.info('Prompt trimmed to fit token budget', {
      playedOmitted: stats.playedOmitted,
      playedIncluded: stats.playedIncluded,
    })
  }

  return { userPrompt: built.prompt, stats }
}

export function estimatePromptTokens(userPrompt: string, model: string): number {
  return estimateMessagesTokens(
    SYSTEM_MESSAGE,
    userPrompt,
    buildRequestBody(model, userPrompt),
  ).requestBodyTokens
}

export { estimateTokens }
