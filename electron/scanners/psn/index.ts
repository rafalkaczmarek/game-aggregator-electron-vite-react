import { getPsnNpsso, getPsnOnlineId } from '../../main/settings/store'
import type { ScanResult } from '../../../shared/types/game'
import { createScopedLogger } from '../../lib/logger'
import { authenticateWithNpsso } from './auth'
import {
  fetchAllPurchasedGames,
  fetchAllUserPlayedGames,
  fetchAllUserTitles,
  resolveAccountId,
} from './api'
import { buildPlayedGamesIndex, purchasedGameToGame, trophyTitleToGame } from './map'

const logger = createScopedLogger('psn')

export async function scanPsn(onlineIdOverride?: string): Promise<ScanResult> {
  const errors: string[] = []

  logger.info('Scan started')

  const npsso = await getPsnNpsso()
  if (!npsso) {
    logger.warn('NPSSO token not configured')
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
      logger.debug('Scanning public profile', { onlineId })
      games = (
        await fetchAllUserTitles(authorization, await resolveAccountId(authorization, onlineId))
      ).map(trophyTitleToGame)
    } else {
      logger.debug('Scanning own library (purchased + play history)')
      const purchasedGames = await fetchAllPurchasedGames(authorization)

      let playedIndex = new Map<string, { playtimeMinutes: number }>()
      try {
        const playedGames = await fetchAllUserPlayedGames(authorization, 'me')
        playedIndex = buildPlayedGamesIndex(playedGames)
      } catch (error) {
        const message = `PSN play history unavailable: ${error instanceof Error ? error.message : String(error)}`
        logger.warn(message)
        errors.push(message)
      }

      games = purchasedGames.map((game) => purchasedGameToGame(game, playedIndex))
    }

    games.sort((a, b) => a.title.localeCompare(b.title))

    if (errors.length > 0) {
      logger.warn('Scan completed with errors', { gameCount: games.length, errors })
    } else {
      logger.info('Scan completed', { gameCount: games.length })
    }

    return {
      platform: 'psn',
      games,
      errors,
    }
  } catch (error) {
    logger.error('Scan failed', error)
    errors.push(`PSN scan failed: ${error instanceof Error ? error.message : String(error)}`)
    return {
      platform: 'psn',
      games: [],
      errors,
    }
  }
}
