import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('metacritic api', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  async function importApi() {
    return import('../electron/metadata/metacritic/api')
  }

  it('tracks e2e api call count when E2E_TEST is enabled', async () => {
    vi.stubEnv('E2E_TEST', '1')
    fetchMock.mockResolvedValue({ ok: false, status: 404 })

    const api = await importApi()
    api.resetE2eMetacriticApiCallCount()
    await api.searchGames('hades')
    await api.fetchGameDetails('hades')

    expect(api.getE2eMetacriticApiCallCount()).toBe(2)
  })

  it('returns empty search results on network or HTTP failures', async () => {
    const { searchGames } = await importApi()

    fetchMock.mockRejectedValueOnce(new Error('network down'))
    await expect(searchGames('hades')).resolves.toEqual([])

    fetchMock.mockResolvedValueOnce({ ok: false, status: 429 })
    await expect(searchGames('hades')).resolves.toEqual([])
  })

  it('parses search hits and skips malformed items', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          items: [
            {
              slug: 'hades',
              title: 'Hades',
              platforms: [{ name: 'PC' }, 'PlayStation 5'],
              criticScoreSummary: { score: '93', url: '/game/hades/' },
              userScoreSummary: { score: 9 },
            },
            { slug: '', title: 'Broken' },
            { slug: 'no-title' },
          ],
        },
      }),
    })

    const { searchGames } = await importApi()
    await expect(searchGames('hades', 5)).resolves.toEqual([
      {
        slug: 'hades',
        title: 'Hades',
        platforms: ['PC', 'PlayStation 5'],
        metascore: 93,
        userScore: 9,
        url: '/game/hades/',
      },
    ])
  })

  it('returns null when game details cannot be parsed', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ components: [{ data: {} }] }),
    })

    const { fetchGameDetails } = await importApi()
    await expect(fetchGameDetails('missing-game')).resolves.toBeNull()
  })

  it('parses game details from composer payloads', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        components: [
          {
            data: {
              item: {
                title: 'Hades',
                slug: 'hades',
                user_score: 9,
                criticScoreSummary: { score: 93, url: '/game/hades/' },
              },
            },
          },
        ],
      }),
    })

    const { fetchGameDetails } = await importApi()
    await expect(fetchGameDetails('hades')).resolves.toEqual({
      slug: 'hades',
      title: 'Hades',
      metascore: 93,
      userScore: 9,
      url: 'https://www.metacritic.com/game/hades/',
    })
  })

  it('falls back to alternate score fields and slug when parsing details', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        components: [
          {
            data: {
              item: {
                metascore: 88,
                userScore: 7.8,
              },
            },
          },
        ],
      }),
    })

    const { fetchGameDetails } = await importApi()
    await expect(fetchGameDetails('fallback-slug')).resolves.toEqual({
      slug: 'fallback-slug',
      title: 'fallback-slug',
      metascore: 88,
      userScore: 7.8,
      url: 'https://www.metacritic.com/game/fallback-slug/',
    })
  })
})
