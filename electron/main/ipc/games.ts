import { ipcMain } from 'electron'
import type { AggregatedLibrary, GamePlatform } from '../../../shared/types/game'
import { GAME_PLATFORMS } from '../../../shared/types/game'
import { clearCachedLibrary, readCachedLibrary, writeCachedLibrary } from '../library/store'
import { scanAllGames, scanPlatform } from '../../scanners'
import { setE2eGalaxyDbPath } from '../../scanners/gog/paths'

export function registerGameIpcHandlers(): void {
  ipcMain.handle('games:get-library', () => readCachedLibrary())

  if (process.env.E2E_TEST === '1') {
    ipcMain.handle('e2e:write-library-cache', (_event, library: AggregatedLibrary) =>
      writeCachedLibrary(library),
    )
    ipcMain.handle('e2e:clear-library-cache', () => clearCachedLibrary())
    ipcMain.handle('e2e:set-gog-galaxy-db', (_event, dbPath: string | null) => {
      setE2eGalaxyDbPath(dbPath)
    })
  }

  ipcMain.handle('games:scan-all', async () => {
    const library = await scanAllGames()
    await writeCachedLibrary(library)
    return library
  })

  ipcMain.handle('games:scan-platform', (_event, platform: GamePlatform) => {
    if (!GAME_PLATFORMS.includes(platform)) {
      throw new Error(`Unknown platform: ${platform}`)
    }
    return scanPlatform(platform)
  })
}
