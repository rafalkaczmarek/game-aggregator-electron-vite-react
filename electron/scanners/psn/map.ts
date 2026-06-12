import type { PurchasedGame, TrophyTitle } from 'psn-api'
import type { Game } from '../../../shared/types/game'

export function purchasedGameToGame(game: PurchasedGame): Game {
  const sourceId = game.titleId || game.entitlementId

  return {
    id: `psn-${sourceId}`,
    platform: 'psn',
    title: game.name,
    coverUrl: game.image?.url || undefined,
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
