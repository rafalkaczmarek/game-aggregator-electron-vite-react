import { describe, expect, it, vi } from 'vitest'
import { fetchSteamStoreDescription } from '@electron/scanners/steam/storeDetails'

describe('fetchSteamStoreDescription', () => {
  it('returns short description from Steam store API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        '570': {
          success: true,
          data: {
            short_description: 'Every day, millions of players worldwide enter battle.',
          },
        },
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchSteamStoreDescription('570')).resolves.toBe(
      'Every day, millions of players worldwide enter battle.',
    )
  })

  it('returns null when the store response is unsuccessful', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        '570': { success: false },
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchSteamStoreDescription('570')).resolves.toBeNull()
  })
})
