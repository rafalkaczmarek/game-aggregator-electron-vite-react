import { ipcMain } from 'electron'
import type { AggregatedLibrary, GamePlatform } from '../../../shared/types/game'
import { GAME_PLATFORMS } from '../../../shared/types/game'
import { createScopedLogger } from '../../lib/logger'
import { getRecommendations } from '../../recommendations'
import { getGithubPat } from '../settings/store'
import { clearCachedLibrary, readCachedLibrary, writeCachedLibrary } from '../library/store'
import { scanAllGames, scanPlatform } from '../../scanners'
import { setE2eGalaxyDbPath } from '../../scanners/gog/paths'
import { setE2ePsnFixture, type PsnE2eFixture } from '../../scanners/psn/e2e'

const logger = createScopedLogger('ipc:games')

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
    ipcMain.handle('e2e:set-psn-fixture', (_event, fixture: PsnE2eFixture | null) => {
      setE2ePsnFixture(fixture)
    })
  }

  ipcMain.handle('games:scan-all', async () => {
    logger.info('games:scan-all invoked')
    const library = await scanAllGames()
    await writeCachedLibrary(library)
    logger.info('games:scan-all finished', { gameCount: library.games.length })
    return library
  })

  ipcMain.handle('games:scan-platform', (_event, platform: GamePlatform) => {
    if (!GAME_PLATFORMS.includes(platform)) {
      logger.error('games:scan-platform unknown platform', { platform })
      throw new Error(`Unknown platform: ${platform}`)
    }
    logger.info('games:scan-platform invoked', { platform })
    return scanPlatform(platform).then((result) => {
      logger.info('games:scan-platform finished', {
        platform,
        gameCount: result.games.length,
        errorCount: result.errors.length,
      })
      return result
    })
  })

  ipcMain.handle('games:get-recommendations', async () => {
    logger.info('games:get-recommendations invoked')
    const library = await readCachedLibrary()
    if (!library) {
      logger.warn('games:get-recommendations — no cached library')
      return {
        owned: [],
        discover: [],
        errors: ['Brak zeskanowanej biblioteki — najpierw uruchom skanowanie.'],
        basedOnPlayedCount: 0,
      }
    }
    const pat = await getGithubPat()
    const result = await getRecommendations(library, pat)
    logger.info('games:get-recommendations finished', {
      ownedCount: result.owned.length,
      discoverCount: result.discover.length,
      errorCount: result.errors.length,
      basedOnPlayedCount: result.basedOnPlayedCount,
    })
    return result
  })
}
