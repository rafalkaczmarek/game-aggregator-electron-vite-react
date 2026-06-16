import type { ScanResult } from '../../../shared/types/game'
import { createScopedLogger } from '../../lib/logger'
import { readGogLibrary } from './db'
import { findGalaxyDbPath } from './paths'

const logger = createScopedLogger('gog')

export async function scanGog(): Promise<ScanResult> {
  const errors: string[] = []

  logger.info('Scan started')

  const dbPath = await findGalaxyDbPath()
  if (!dbPath) {
    logger.warn('GOG Galaxy database not found')
    return {
      platform: 'gog',
      games: [],
      errors: ['GOG Galaxy database not found'],
    }
  }

  logger.debug('Galaxy database found', { dbPath })

  try {
    const games = readGogLibrary(dbPath)
    logger.info('Scan completed', { gameCount: games.length })
    return {
      platform: 'gog',
      games,
      errors,
    }
  } catch (error) {
    const message = `GOG Galaxy database read failed: ${error instanceof Error ? error.message : String(error)}`
    logger.error('Scan failed', error)
    errors.push(message)
    return {
      platform: 'gog',
      games: [],
      errors,
    }
  }
}
