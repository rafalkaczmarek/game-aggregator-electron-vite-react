import { getSteamApiKey } from '../../main/settings/store'
import type { Game, ScanResult } from '../../../shared/types/game'
import { createScopedLogger } from '../../lib/logger'
import { enrichFromSteamWebApi } from './api'
import { mergeLocalApps, readLocalConfigApps, resolveMissingNames, scanAcfDirectory } from './acf'
import { findSteamPath, getMostRecentSteamId, getSteamAppsDirs } from './paths'

const logger = createScopedLogger('steam')

export async function scanSteam(): Promise<ScanResult> {
  const errors: string[] = []
  const games = new Map<string, Game>()

  logger.info('Scan started')

  const steamPath = await findSteamPath()
  if (!steamPath) {
    logger.warn('Steam installation not found')
    return {
      platform: 'steam',
      games: [],
      errors: ['Steam installation not found'],
    }
  }

  logger.debug('Steam path resolved', { steamPath })

  const steamAppsDirs = await getSteamAppsDirs(steamPath)
  await Promise.all(steamAppsDirs.map((dir) => scanAcfDirectory(dir, games, errors)))

  const steamId = await getMostRecentSteamId(steamPath)
  let missingNames: string[] = []

  if (steamId) {
    const localApps = await readLocalConfigApps(steamPath, steamId)
    missingNames = mergeLocalApps(games, localApps)

    const apiKey = await getSteamApiKey()
    if (apiKey) {
      try {
        await enrichFromSteamWebApi(apiKey, steamId, games)
      } catch (error) {
        const message = `Steam Web API failed: ${error instanceof Error ? error.message : String(error)}`
        logger.warn(message)
        errors.push(message)
      }
    } else {
      logger.debug('Steam Web API key not configured — skipping enrichment')
    }
  } else {
    logger.debug('Steam user ID not found — skipping library enrichment')
  }

  const unresolvedNames = missingNames.filter((appId) =>
    games.get(appId)?.title.startsWith('Steam App '),
  )
  if (unresolvedNames.length > 0) {
    await resolveMissingNames(games, unresolvedNames, errors)
  }

  const sortedGames = [...games.values()].sort((a, b) => a.title.localeCompare(b.title))

  if (errors.length > 0) {
    logger.warn('Scan completed with errors', { gameCount: sortedGames.length, errors })
  } else {
    logger.info('Scan completed', { gameCount: sortedGames.length })
  }

  return {
    platform: 'steam',
    games: sortedGames,
    errors,
  }
}
