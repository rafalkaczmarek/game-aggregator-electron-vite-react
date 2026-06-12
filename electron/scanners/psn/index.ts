import { getPsnNpsso, getPsnOnlineId } from '../../main/settings/store'
import type { ScanResult } from '../../../shared/types/game'
import { authenticateWithNpsso } from './auth'
import { fetchAllPurchasedGames, fetchAllUserTitles, resolveAccountId } from './api'
import { purchasedGameToGame, trophyTitleToGame } from './map'

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

    const games = onlineId
      ? (await fetchAllUserTitles(
          authorization,
          await resolveAccountId(authorization, onlineId),
        )).map(trophyTitleToGame)
      : (await fetchAllPurchasedGames(authorization)).map(purchasedGameToGame)

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
