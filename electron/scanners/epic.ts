import type { ScanResult } from '../../shared/types/game'

/** Epic: manifests in ProgramData\\Epic\\EpicGamesLauncher\\Data\\Manifests\\. */
export async function scanEpic(): Promise<ScanResult> {
  return {
    platform: 'epic',
    games: [],
    errors: ['Epic scanner not implemented yet'],
  }
}
