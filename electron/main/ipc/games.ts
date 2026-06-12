import { ipcMain } from 'electron'
import type { GamePlatform } from '../../../shared/types/game'
import { GAME_PLATFORMS } from '../../../shared/types/game'
import { scanAllGames, scanPlatform } from '../../scanners'

export function registerGameIpcHandlers(): void {
  ipcMain.handle('games:scan-all', () => scanAllGames())

  ipcMain.handle('games:scan-platform', (_event, platform: GamePlatform) => {
    if (!GAME_PLATFORMS.includes(platform)) {
      throw new Error(`Unknown platform: ${platform}`)
    }
    return scanPlatform(platform)
  })
}
