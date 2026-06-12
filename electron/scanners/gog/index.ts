import type { ScanResult } from '../../../shared/types/game'
import { readGogLibrary } from './db'
import { findGalaxyDbPath } from './paths'

export async function scanGog(): Promise<ScanResult> {
  const errors: string[] = []

  const dbPath = await findGalaxyDbPath()
  if (!dbPath) {
    return {
      platform: 'gog',
      games: [],
      errors: ['GOG Galaxy database not found'],
    }
  }

  try {
    const games = readGogLibrary(dbPath)
    return {
      platform: 'gog',
      games,
      errors,
    }
  } catch (error) {
    errors.push(`GOG Galaxy database read failed: ${error instanceof Error ? error.message : String(error)}`)
    return {
      platform: 'gog',
      games: [],
      errors,
    }
  }
}
