import type { AggregatedLibrary, Game, GamePlatform, ScanResult } from '../../shared/types/game'
import { GAME_PLATFORMS } from '../../shared/types/game'
import { createScopedLogger } from '../lib/logger'
import { readGogGalaxyLibrary } from './gog/db'
import { findGalaxyDbPath } from './gog/paths'
import { scanEpic } from './epic'
import { scanGog } from './gog/index'
import { scanPsn } from './psn'
import { scanSteam } from './steam'

const logger = createScopedLogger('scanners')

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

/** Platforms that must always use their dedicated scanner (GOG Galaxy DB is stale or unsupported). */
const PLATFORMS_EXCLUDED_FROM_GOG_DB: ReadonlySet<GamePlatform> = new Set(['psn'])

async function scanPlatformWithGogFallback(
  platform: GamePlatform,
  gamesFromDb: Partial<Record<GamePlatform, Game[]>>,
): Promise<ScanResult> {
  if (PLATFORMS_EXCLUDED_FROM_GOG_DB.has(platform)) {
    return scanners[platform]()
  }

  const dbGames = gamesFromDb[platform]
  if (dbGames && dbGames.length > 0) {
    logger.debug('Using GOG Galaxy DB data', { platform, gameCount: dbGames.length })
    return { platform, games: dbGames, errors: [] }
  }
  return scanners[platform]()
}

export async function scanAllGames(): Promise<AggregatedLibrary> {
  logger.info('Full library scan started')

  const dbPath = await findGalaxyDbPath()
  if (!dbPath) {
    logger.debug('GOG Galaxy DB not found — using individual scanners')
    const library = await scanAllWithIndividualScanners()
    logScanSummary(library)
    return library
  }

  logger.debug('GOG Galaxy DB found — using hybrid scan', { dbPath })

  try {
    const gamesFromDb = readGogGalaxyLibrary(dbPath)
    const results = await Promise.all(
      GAME_PLATFORMS.map((platform) => scanPlatformWithGogFallback(platform, gamesFromDb)),
    )
    const library = buildAggregatedLibrary(results)
    logScanSummary(library)
    return library
  } catch (error) {
    logger.warn('GOG Galaxy DB read failed — falling back to individual scanners', error)
    const library = await scanAllWithIndividualScanners()
    logScanSummary(library)
    return library
  }
}

function logScanSummary(library: AggregatedLibrary): void {
  const platformSummary = library.results.map((r) => ({
    platform: r.platform,
    games: r.games.length,
    errors: r.errors.length,
  }))
  const totalErrors = library.results.reduce((sum, r) => sum + r.errors.length, 0)

  if (totalErrors > 0) {
    logger.warn('Full library scan completed with errors', {
      gameCount: library.games.length,
      platforms: platformSummary,
    })
  } else {
    logger.info('Full library scan completed', {
      gameCount: library.games.length,
      platforms: platformSummary,
    })
  }
}
