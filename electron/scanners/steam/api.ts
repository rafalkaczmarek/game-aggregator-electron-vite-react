import type { Game } from '../../../shared/types/game'

interface OwnedGame {
  appid: number
  name?: string
  playtime_forever?: number
  img_icon_url?: string
}

interface GetOwnedGamesResponse {
  response?: {
    game_count?: number
    games?: OwnedGame[]
  }
}

function steamIconUrl(appId: string, iconHash: string): string {
  return `https://media.steampowered.com/steamcommunity/public/images/apps/${appId}/${iconHash}.jpg`
}

function steamHeaderUrl(appId: string): string {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`
}

export async function enrichFromSteamWebApi(
  apiKey: string,
  steamId: string,
  games: Map<string, Game>,
): Promise<void> {
  const url = new URL('https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/')
  url.searchParams.set('key', apiKey)
  url.searchParams.set('steamid', steamId)
  url.searchParams.set('include_appinfo', '1')
  url.searchParams.set('include_played_free_games', '1')
  url.searchParams.set('format', 'json')

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Steam Web API responded with ${response.status}`)
  }

  const payload = (await response.json()) as GetOwnedGamesResponse
  const ownedGames = payload.response?.games ?? []

  for (const owned of ownedGames) {
    const appId = String(owned.appid)
    const existing = games.get(appId)
    const coverUrl = owned.img_icon_url
      ? steamIconUrl(appId, owned.img_icon_url)
      : (existing?.coverUrl ?? steamHeaderUrl(appId))

    games.set(appId, {
      id: `steam-${appId}`,
      platform: 'steam',
      title: owned.name ?? existing?.title ?? `Steam App ${appId}`,
      coverUrl,
      playtimeMinutes: owned.playtime_forever ?? existing?.playtimeMinutes,
      installed: existing?.installed ?? false,
      sourceId: appId,
    })
  }
}
