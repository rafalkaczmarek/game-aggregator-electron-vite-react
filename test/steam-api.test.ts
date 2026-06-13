import { describe, expect, it, vi } from 'vitest'
import type { Game } from '@shared/types/game'
import { enrichFromSteamWebApi } from '../electron/scanners/steam/api'

describe('steam web api enrichment', () => {
  it('merges owned games and uses icon url when available', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          response: {
            games: [
              {
                appid: 570,
                name: 'Dota 2',
                playtime_forever: 200,
                img_icon_url: 'abc123',
              },
              {
                appid: 999,
                name: 'New Game',
              },
            ],
          },
        }),
      })),
    )

    const games = new Map<string, Game>([
      [
        '570',
        {
          id: 'steam-570',
          platform: 'steam',
          title: 'Old Title',
          installed: true,
          sourceId: '570',
        },
      ],
    ])

    await enrichFromSteamWebApi('test-key', '76561198000000000', games)

    expect(games.get('570')).toMatchObject({
      title: 'Dota 2',
      installed: true,
      playtimeMinutes: 200,
      coverUrl: 'https://media.steampowered.com/steamcommunity/public/images/apps/570/abc123.jpg',
    })
    expect(games.get('999')).toMatchObject({
      title: 'New Game',
      installed: false,
      coverUrl: 'https://cdn.cloudflare.steamstatic.com/steam/apps/999/header.jpg',
    })
  })

  it('throws when api responds with error status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 403 })),
    )

    await expect(enrichFromSteamWebApi('bad-key', '76561198000000000', new Map())).rejects.toThrow(
      'Steam Web API responded with 403',
    )
  })
})
