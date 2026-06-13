import { getSteamApiKey } from '../../main/settings/store'
import type { Game, ScanResult } from '../../../shared/types/game'
import { enrichFromSteamWebApi } from './api'
import { mergeLocalApps, readLocalConfigApps, resolveMissingNames, scanAcfDirectory } from './acf'
import { findSteamPath, getMostRecentSteamId, getSteamAppsDirs } from './paths'

export async function scanSteam(): Promise<ScanResult> {
  const errors: string[] = []
  const games = new Map<string, Game>()

  const steamPath = await findSteamPath()
  if (!steamPath) {
    return {
      platform: 'steam',
      games: [],
      errors: ['Steam installation not found'],
    }
  }

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
        errors.push(
          `Steam Web API failed: ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    }
  }

  const unresolvedNames = missingNames.filter((appId) =>
    games.get(appId)?.title.startsWith('Steam App '),
  )
  if (unresolvedNames.length > 0) {
    await resolveMissingNames(games, unresolvedNames, errors)
  }

  const sortedGames = [...games.values()].sort((a, b) => a.title.localeCompare(b.title))

  return {
    platform: 'steam',
    games: sortedGames,
    errors,
  }
}
