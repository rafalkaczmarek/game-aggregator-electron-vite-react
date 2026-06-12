import { getPsnNpsso, getPsnOnlineId } from '../../main/settings/store'
import type { ScanResult } from '../../../shared/types/game'
import { authenticateWithNpsso } from './auth'
import {
  fetchAllPurchasedGames,
  fetchAllUserPlayedGames,
  fetchAllUserTitles,
  resolveAccountId,
} from './api'
import { buildPlayedGamesIndex, purchasedGameToGame, trophyTitleToGame } from './map'

export async function scanPsn(onlineIdOverride?: string): Promise<ScanResult> {
  const errors: string[] = []

  const npsso = await getPsnNpsso()
  if (!npsso) {
    return {
      platform: 'psn',
      games: [],
      errors: ['PSN NPSSO token not configured. Add it in Settings or set PSN_NPSSO.'],
    }
  }

  try {
    const authorization = await authenticateWithNpsso(npsso)
    const onlineId = onlineIdOverride?.trim() || (await getPsnOnlineId())

    let games: ReturnType<typeof purchasedGameToGame>[]

    if (onlineId) {
      games = (
        await fetchAllUserTitles(
          authorization,
          await resolveAccountId(authorization, onlineId),
        )
      ).map(trophyTitleToGame)
    } else {
      const purchasedGames = await fetchAllPurchasedGames(authorization)

      let playedIndex = new Map<string, { playtimeMinutes: number }>()
      try {
        const playedGames = await fetchAllUserPlayedGames(authorization, 'me')
        playedIndex = buildPlayedGamesIndex(playedGames)
      } catch (error) {
        errors.push(
          `PSN play history unavailable: ${error instanceof Error ? error.message : String(error)}`,
        )
      }

      games = purchasedGames.map((game) => purchasedGameToGame(game, playedIndex))
    }

    games.sort((a, b) => a.title.localeCompare(b.title))

    return {
      platform: 'psn',
      games,
      errors,
    }
  } catch (error) {
    errors.push(
      `PSN scan failed: ${error instanceof Error ? error.message : String(error)}`,
    )
    return {
      platform: 'psn',
      games: [],
      errors,
    }
  }
}
