import type { PurchasedGame, TrophyTitle, UserPlayedGamesResponse } from 'psn-api'
import type { Game } from '../../../shared/types/game'
import { parsePlayDurationToMinutes } from './duration'

type PlayedGameTitle = UserPlayedGamesResponse['titles'][number]

interface PlayedGameStats {
  playtimeMinutes: number
}

export function buildPlayedGamesIndex(
  playedGames: PlayedGameTitle[],
): Map<string, PlayedGameStats> {
  const index = new Map<string, PlayedGameStats>()

  for (const played of playedGames) {
    const playtimeMinutes =
      parsePlayDurationToMinutes(played.playDuration) ?? (played.playCount > 0 ? 1 : undefined)

    if (playtimeMinutes == null) continue

    const stats: PlayedGameStats = { playtimeMinutes }
    const titleIds = new Set([played.titleId, ...played.concept.titleIds])

    for (const titleId of titleIds) {
      const existing = index.get(titleId)
      if (!existing || existing.playtimeMinutes < playtimeMinutes) {
        index.set(titleId, stats)
      }
    }
  }

  return index
}

export function purchasedGameToGame(
  game: PurchasedGame,
  playedIndex?: Map<string, PlayedGameStats>,
): Game {
  const sourceId = game.titleId || game.entitlementId
  const played = playedIndex?.get(sourceId)

  return {
    id: `psn-${sourceId}`,
    platform: 'psn',
    title: game.name,
    coverUrl: game.image?.url || undefined,
    playtimeMinutes: played?.playtimeMinutes,
    installed: false,
    sourceId,
  }
}

export function trophyTitleToGame(title: TrophyTitle): Game {
  return {
    id: `psn-${title.npCommunicationId}`,
    platform: 'psn',
    title: title.trophyTitleName,
    coverUrl: title.trophyTitleIconUrl || undefined,
    installed: false,
    sourceId: title.npCommunicationId,
  }
}
