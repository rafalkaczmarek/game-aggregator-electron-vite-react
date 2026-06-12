import type { ScanResult } from '../../shared/types/game'

/** PSN: psn-api + npsso token; public profile via Online ID. */
export async function scanPsn(_onlineId?: string): Promise<ScanResult> {
  return {
    platform: 'psn',
    games: [],
    errors: ['PSN scanner not implemented yet'],
  }
}
