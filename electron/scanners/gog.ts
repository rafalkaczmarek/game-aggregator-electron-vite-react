import type { ScanResult } from '../../shared/types/game'

/** GOG Galaxy SQLite under %ProgramData%\\GOG.com\\Galaxy\\storage\\. */
export async function scanGog(): Promise<ScanResult> {
  return {
    platform: 'gog',
    games: [],
    errors: ['GOG scanner not implemented yet'],
  }
}
