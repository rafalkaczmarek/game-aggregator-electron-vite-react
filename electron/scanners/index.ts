import type { AggregatedLibrary, GamePlatform, ScanResult } from '../../shared/types/game'
import { scanEpic } from './epic'
import { scanGog } from './gog'
import { scanPsn } from './psn'
import { scanSteam } from './steam'

const scanners: Record<GamePlatform, () => Promise<ScanResult>> = {
  steam: scanSteam,
  gog: scanGog,
  epic: scanEpic,
  psn: () => scanPsn(),
}

export async function scanPlatform(platform: GamePlatform): Promise<ScanResult> {
  return scanners[platform]()
}

export async function scanAllGames(): Promise<AggregatedLibrary> {
  const results = await Promise.all(
    (Object.keys(scanners) as GamePlatform[]).map((platform) => scanners[platform]()),
  )

  return {
    games: results.flatMap((result) => result.games),
    scannedAt: new Date().toISOString(),
    results,
  }
}
