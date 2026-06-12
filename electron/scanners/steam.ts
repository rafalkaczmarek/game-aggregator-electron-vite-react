import type { ScanResult } from '../../shared/types/game'

/** Steam: libraryfolders.vdf, steamapps/*.acf, optional Steam Web API. */
export async function scanSteam(): Promise<ScanResult> {
  return {
    platform: 'steam',
    games: [],
    errors: ['Steam scanner not implemented yet'],
  }
}
