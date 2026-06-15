import { describe, expect, it } from 'vitest'
import type { Game } from '@shared/types/game'
import { mapAiRecommendations, parseAiRecommendationsJson } from '../electron/recommendations/ai'
import {
  buildLibrarySnapshot,
  findLibraryMatch,
  findUnplayedMatch,
  isOwnedTitle,
} from '../electron/recommendations/librarySnapshot'
import {
  buildPromptWithinTokenBudget,
  buildUserPrompt,
  estimatePromptTokens,
} from '../electron/recommendations/prompt'
import { GITHUB_MODELS_PROMPT_TOKEN_BUDGET } from '../electron/recommendations/tokenEstimate'

const games: Game[] = [
  {
    id: 'steam-570',
    platform: 'steam',
    title: 'Dota 2',
    installed: true,
    playtimeMinutes: 6000,
    sourceId: '570',
  },
  {
    id: 'gog-cp',
    platform: 'gog',
    title: 'Cyberpunk 2077',
    installed: false,
    playtimeMinutes: 0,
  },
  {
    id: 'epic-alan',
    platform: 'epic',
    title: 'Alan Wake',
    installed: true,
    playtimeMinutes: 120,
    sourceId: '2',
  },
]

describe('library snapshot', () => {
  it('groups played and unplayed titles', () => {
    const snapshot = buildLibrarySnapshot(games)

    expect(snapshot.played).toHaveLength(2)
    expect(snapshot.unplayed).toHaveLength(1)
    expect(snapshot.unplayed[0]?.title).toBe('Cyberpunk 2077')
    expect(snapshot.played[0]?.title).toBe('Dota 2')
  })

  it('matches unplayed titles fuzzily', () => {
    const snapshot = buildLibrarySnapshot(games)
    expect(findUnplayedMatch('cyberpunk 2077', snapshot.unplayed)?.title).toBe('Cyberpunk 2077')
  })

  it('finds library matches for played and unplayed titles', () => {
    const snapshot = buildLibrarySnapshot(games)

    expect(findLibraryMatch('Cyberpunk 2077', snapshot)?.playtimeMinutes).toBe(0)
    expect(findLibraryMatch('Dota 2', snapshot)?.playtimeMinutes).toBe(6000)
    expect(findLibraryMatch('Hades', snapshot)).toBeUndefined()
  })

  it('detects owned titles', () => {
    const snapshot = buildLibrarySnapshot(games)
    expect(isOwnedTitle('Dota 2', snapshot.ownedTitles)).toBe(true)
    expect(isOwnedTitle("Baldur's Gate 3", snapshot.ownedTitles)).toBe(false)
  })
})

describe('AI recommendation mapping', () => {
  it('routes library matches to owned and unknown titles to discover', () => {
    const snapshot = buildLibrarySnapshot(games)
    const mapped = mapAiRecommendations(
      [
        {
          title: 'Cyberpunk 2077',
          reason: 'Masz ją w katalogu, a klimat przypomina Dota 2.',
        },
        {
          title: 'Dota 2',
          reason: 'Pomijamy — już rozegrane.',
        },
        {
          title: 'Hades',
          reason: 'Szybka rozgrywka jak w ulubionych akcjowych tytułach.',
        },
      ],
      snapshot,
    )

    expect(mapped.owned).toHaveLength(1)
    expect(mapped.owned[0]).toMatchObject({
      title: 'Cyberpunk 2077',
      source: 'owned',
      platform: 'gog',
    })
    expect(mapped.discover).toHaveLength(1)
    expect(mapped.discover[0]?.title).toBe('Hades')
    expect(mapped.errors).toHaveLength(0)
  })

  it('supports legacy owned/discover arrays via flattened mapping', () => {
    const snapshot = buildLibrarySnapshot(games)
    const mapped = mapAiRecommendations(
      [
        { title: 'Cyberpunk 2077', reason: 'Z katalogu.' },
        { title: 'Hades', reason: 'Nowość.' },
      ],
      snapshot,
    )

    expect(mapped.owned[0]?.title).toBe('Cyberpunk 2077')
    expect(mapped.discover[0]?.title).toBe('Hades')
  })

  it('skips already played library matches', () => {
    const snapshot = buildLibrarySnapshot(games)
    const mapped = mapAiRecommendations([{ title: 'Dota 2', reason: 'Już grane.' }], snapshot)

    expect(mapped.owned).toHaveLength(0)
    expect(mapped.discover).toHaveLength(0)
  })
})

describe('parseAiRecommendationsJson', () => {
  it('parses recommendations array', () => {
    const items = parseAiRecommendationsJson(
      '{"recommendations":[{"title":"Hades","reason":"Super gra."}]}',
    )

    expect(items).toEqual([{ title: 'Hades', reason: 'Super gra.' }])
  })

  it('falls back to owned and discover arrays', () => {
    const items = parseAiRecommendationsJson(
      '{"owned":[{"title":"A","reason":"1"}],"discover":[{"title":"B","reason":"2"}]}',
    )

    expect(items).toHaveLength(2)
  })

  it('throws on invalid json', () => {
    expect(() => parseAiRecommendationsJson('not-json')).toThrow('niepoprawny JSON')
  })
})

function createLargeLibrary(gameCount: number): Game[] {
  const games: Game[] = []
  for (let index = 0; index < gameCount; index++) {
    games.push({
      id: `steam-${index}`,
      platform: 'steam',
      title: `Very Long Game Title Number ${index} With Extra Words`,
      installed: index % 2 === 0,
      playtimeMinutes: index % 3 === 0 ? index * 30 : 0,
      sourceId: String(index),
    })
  }
  return games
}

describe('prompt token budget', () => {
  it('includes only played titles in the prompt', () => {
    const snapshot = buildLibrarySnapshot(games)
    const { prompt } = buildUserPrompt(snapshot, snapshot.played.length)

    expect(prompt).toContain('Dota 2')
    expect(prompt).toContain('Alan Wake')
    expect(prompt).not.toContain('Cyberpunk 2077')
    expect(prompt).not.toContain('KATALOG_NIEZAGRANY')
  })

  it('fits as many played titles as possible within the token budget', () => {
    const snapshot = buildLibrarySnapshot(createLargeLibrary(500))
    const { stats } = buildPromptWithinTokenBudget(snapshot, 'openai/gpt-4.1-mini')

    expect(stats.requestBodyTokens).toBeLessThanOrEqual(GITHUB_MODELS_PROMPT_TOKEN_BUDGET)
    expect(stats.playedIncluded).toBeGreaterThan(MIN_PLAYED_OR_ZERO(snapshot))
    expect(stats.unplayedIncluded).toBe(0)
    expect(stats.withinBudget).toBe(true)
  })

  it('estimates request body tokens from prompt text', () => {
    const snapshot = buildLibrarySnapshot(games)
    const { prompt } = buildUserPrompt(snapshot, snapshot.played.length)
    const tokens = estimatePromptTokens(prompt, 'openai/gpt-4.1-mini')

    expect(tokens).toBeGreaterThan(50)
    expect(tokens).toBeLessThan(2000)
  })
})

function MIN_PLAYED_OR_ZERO(snapshot: ReturnType<typeof buildLibrarySnapshot>): number {
  return Math.min(8, snapshot.played.length)
}
