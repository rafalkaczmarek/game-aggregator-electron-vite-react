import { describe, expect, it } from 'vitest'
import { mapAiRecommendations, parseAiRecommendationsJson } from '../../electron/recommendations/ai'
import { buildLibrarySnapshot } from '../../electron/recommendations/librarySnapshot'
import { recommendationGames } from '../fixtures/recommendationGames'

describe('AI recommendation mapping', () => {
  it('routes library matches to owned and unknown titles to discover', () => {
    const snapshot = buildLibrarySnapshot(recommendationGames)
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
    const snapshot = buildLibrarySnapshot(recommendationGames)
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
    const snapshot = buildLibrarySnapshot(recommendationGames)
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
