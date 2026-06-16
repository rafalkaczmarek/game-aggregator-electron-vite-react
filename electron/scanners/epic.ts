import type { ScanResult } from '../../shared/types/game'
import { createScopedLogger } from '../lib/logger'

const logger = createScopedLogger('epic')

/** Epic: manifests in ProgramData\\Epic\\EpicGamesLauncher\\Data\\Manifests\\. */
export async function scanEpic(): Promise<ScanResult> {
  logger.info('Scan skipped — not implemented yet')
  return {
    platform: 'epic',
    games: [],
    errors: ['Epic scanner not implemented yet'],
  }
}
