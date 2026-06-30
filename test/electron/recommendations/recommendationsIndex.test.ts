import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockLibrary } from '@test/fixtures/games'

const getAiRecommendations = vi.fn()

vi.mock('@electron/recommendations/ai', async (importOriginal) => {
  const original = await importOriginal<typeof import('@electron/recommendations/ai')>()
  return {
    ...original,
    getAiRecommendations,
    createGitHubModelsRecommendationsClient: vi.fn(() => ({})),
  }
})

const { getRecommendations } = await import('@electron/recommendations/index')

describe('getRecommendations', () => {
  beforeEach(() => {
    getAiRecommendations.mockReset()
  })

  it('returns error when github pat is missing', async () => {
    const result = await getRecommendations(createMockLibrary(), undefined)

    expect(result.owned).toEqual([])
    expect(result.errors[0]).toContain('Brak tokenu GitHub PAT')
    expect(getAiRecommendations).not.toHaveBeenCalled()
  })

  it('returns error when library has no played games', async () => {
    const library = createMockLibrary([
      {
        id: 'gog-1',
        platform: 'gog',
        title: 'Cyberpunk 2077',
        installed: false,
        playtimeMinutes: 0,
      },
    ])

    const result = await getRecommendations(library, 'ghp_test')

    expect(result.errors[0]).toContain('Brak gier z czasem gry')
    expect(getAiRecommendations).not.toHaveBeenCalled()
  })

  it('maps AI results and adds helper errors', async () => {
    getAiRecommendations.mockResolvedValue({
      owned: [],
      discover: [],
      errors: [],
    })

    const result = await getRecommendations(createMockLibrary(), 'ghp_test')

    expect(getAiRecommendations).toHaveBeenCalled()
    expect(result.basedOnPlayedCount).toBeGreaterThan(0)
    expect(result.errors.some((message) => message.includes('niezagranych gier'))).toBe(true)
    expect(result.errors.some((message) => message.includes('spoza biblioteki'))).toBe(true)
  })

  it('returns API error message when AI call fails', async () => {
    getAiRecommendations.mockRejectedValue(new Error('GitHub Models API error 413'))

    const result = await getRecommendations(createMockLibrary(), 'ghp_test')

    expect(result.owned).toEqual([])
    expect(result.errors[0]).toContain('413')
  })

  it('forwards user message to AI recommendations', async () => {
    getAiRecommendations.mockResolvedValue({
      owned: [],
      discover: [{ title: 'Hades', reason: 'Indie', source: 'discover' }],
      errors: [],
    })

    await getRecommendations(createMockLibrary(), 'ghp_test', {
      userMessage: 'gry indie',
    })

    expect(getAiRecommendations).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      { userMessage: 'gry indie' },
    )
  })
})
