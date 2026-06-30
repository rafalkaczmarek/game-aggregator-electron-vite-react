import { describe, expect, it } from 'vitest'
import { buildLibrarySnapshot } from '../../electron/recommendations/librarySnapshot'
import {
  buildPromptWithinTokenBudget,
  buildUserPrompt,
  estimatePromptTokens,
} from '../../electron/recommendations/prompt'
import { GITHUB_MODELS_PROMPT_TOKEN_BUDGET } from '../../electron/recommendations/tokenEstimate'
import {
  createLargeRecommendationLibrary,
  recommendationGames,
} from '../fixtures/recommendationGames'

describe('prompt token budget', () => {
  it('includes only played titles in the prompt', () => {
    const snapshot = buildLibrarySnapshot(recommendationGames)
    const { prompt } = buildUserPrompt(snapshot, snapshot.played.length)

    expect(prompt).toContain('Dota 2')
    expect(prompt).toContain('Alan Wake')
    expect(prompt).not.toContain('Cyberpunk 2077')
    expect(prompt).not.toContain('KATALOG_NIEZAGRANY')
  })

  it('includes optional user message in the prompt', () => {
    const snapshot = buildLibrarySnapshot(recommendationGames)
    const { prompt } = buildUserPrompt(snapshot, snapshot.played.length, 'gry indie i RPG')

    expect(prompt).toContain('DODATKOWE WSKAZÓWKI OD UŻYTKOWNIKA')
    expect(prompt).toContain('gry indie i RPG')
    expect(prompt).toContain('Uwzględnij te preferencje przy wyborze rekomendacji.')
  })

  it('omits blank user message from the prompt', () => {
    const snapshot = buildLibrarySnapshot(recommendationGames)
    const { prompt } = buildUserPrompt(snapshot, snapshot.played.length, '   ')

    expect(prompt).not.toContain('DODATKOWE WSKAZÓWKI OD UŻYTKOWNIKA')
  })

  it('truncates user message to max length in the prompt', () => {
    const snapshot = buildLibrarySnapshot(recommendationGames)
    const longMessage = 'x'.repeat(600)
    const { prompt } = buildUserPrompt(snapshot, snapshot.played.length, longMessage)

    expect(prompt).toContain('x'.repeat(500))
    expect(prompt).not.toContain('x'.repeat(501))
  })

  it('fits as many played titles as possible within the token budget', () => {
    const snapshot = buildLibrarySnapshot(createLargeRecommendationLibrary(500))
    const { stats } = buildPromptWithinTokenBudget(snapshot, 'openai/gpt-4.1-mini')

    expect(stats.requestBodyTokens).toBeLessThanOrEqual(GITHUB_MODELS_PROMPT_TOKEN_BUDGET)
    expect(stats.playedIncluded).toBeGreaterThan(minPlayedOrZero(snapshot))
    expect(stats.unplayedIncluded).toBe(0)
    expect(stats.withinBudget).toBe(true)
  })

  it('estimates request body tokens from prompt text', () => {
    const snapshot = buildLibrarySnapshot(recommendationGames)
    const { prompt } = buildUserPrompt(snapshot, snapshot.played.length)
    const tokens = estimatePromptTokens(prompt, 'openai/gpt-4.1-mini')

    expect(tokens).toBeGreaterThan(50)
    expect(tokens).toBeLessThan(2000)
  })
})

function minPlayedOrZero(snapshot: ReturnType<typeof buildLibrarySnapshot>): number {
  return Math.min(8, snapshot.played.length)
}
