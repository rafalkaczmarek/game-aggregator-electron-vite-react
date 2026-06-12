import type { AggregatedLibrary, Game, GamePlatform, ScanResult } from '../../shared/types/game'
import { GAME_PLATFORMS } from '../../shared/types/game'
import { readGogGalaxyLibrary } from './gog/db'
import { findGalaxyDbPath } from './gog/paths'
import { scanEpic } from './epic'
import { scanGog } from './gog/index'
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

function buildAggregatedLibrary(results: ScanResult[]): AggregatedLibrary {
  return {
    games: results.flatMap((result) => result.games),
    scannedAt: new Date().toISOString(),
    results,
  }
}

async function scanAllWithIndividualScanners(): Promise<AggregatedLibrary> {
  const results = await Promise.all(GAME_PLATFORMS.map((platform) => scanners[platform]()))
  return buildAggregatedLibrary(results)
}

async function scanPlatformWithGogFallback(
  platform: GamePlatform,
  gamesFromDb: Partial<Record<GamePlatform, Game[]>>,
): Promise<ScanResult> {
  const dbGames = gamesFromDb[platform]
  if (dbGames && dbGames.length > 0) {
    return { platform, games: dbGames, errors: [] }
  }
  return scanners[platform]()
}

export async function scanAllGames(): Promise<AggregatedLibrary> {
  const dbPath = await findGalaxyDbPath()
  if (!dbPath) {
    return scanAllWithIndividualScanners()
  }

  try {
    const gamesFromDb = readGogGalaxyLibrary(dbPath)
    const results = await Promise.all(
      GAME_PLATFORMS.map((platform) => scanPlatformWithGogFallback(platform, gamesFromDb)),
    )
    return buildAggregatedLibrary(results)
  } catch {
    return scanAllWithIndividualScanners()
  }
}
