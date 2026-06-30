import { ipcMain } from 'electron'
import type { GameDescriptionRequest, GamePlatform } from '../../../shared/types/game'
import { fetchSteamStoreDescription } from '../../scanners/steam/storeDetails'
import { GAME_PLATFORMS } from '../../../shared/types/game'
import { createScopedLogger } from '../../lib/logger'
import { getRecommendations } from '../../recommendations'
import { getGithubPat } from '../settings/store'
import { readCachedLibrary, writeCachedLibrary } from '../library/store'
import { scanAllGamesWithoutMetacritic, scanPlatform } from '../../scanners'
import { registerGamesE2eIpcHandlers } from './gamesE2e'
import { isMetacriticEnrichmentInProgress, startMetacriticEnrichment } from './metacriticEnrichment'

const logger = createScopedLogger('ipc:games')

export function registerGameIpcHandlers(): void {
  ipcMain.handle('games:get-library', async () => {
    const startedAt = performance.now()
    const library = await readCachedLibrary()
    const durationMs = Math.round(performance.now() - startedAt)

    logger.info('games:get-library finished', {
      durationMs,
      gameCount: library?.games.length ?? 0,
      cached: library !== null,
    })

    return library
  })

  if (process.env.E2E_TEST === '1') {
    registerGamesE2eIpcHandlers()
  }

  ipcMain.handle('games:scan-all', async () => {
    logger.info('games:scan-all invoked')
    const library = await scanAllGamesWithoutMetacritic()
    await writeCachedLibrary(library)
    logger.info('games:scan-all finished', { gameCount: library.games.length })

    return library
  })

  ipcMain.handle('games:enrich-metacritic', async () => {
    if (process.env.E2E_TEST === '1') {
      throw new Error('Metacritic enrichment is disabled in E2E tests')
    }

    if (isMetacriticEnrichmentInProgress()) {
      throw new Error('Metacritic enrichment is already running')
    }

    const library = await readCachedLibrary()
    if (!library || library.games.length === 0) {
      throw new Error('No library to enrich — scan your libraries first.')
    }

    logger.info('games:enrich-metacritic invoked', { gameCount: library.games.length })
    startMetacriticEnrichment(library)
    return { started: true as const }
  })

  ipcMain.handle('games:get-game-description', async (_event, request: GameDescriptionRequest) => {
    if (request.platform === 'steam' && request.sourceId) {
      const text = await fetchSteamStoreDescription(request.sourceId)
      if (text) {
        return { text, source: 'steam' as const }
      }
    }

    return null
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

  ipcMain.handle('games:get-recommendations', async (_event, options) => {
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
    const result = await getRecommendations(library, pat, options)
    logger.info('games:get-recommendations finished', {
      ownedCount: result.owned.length,
      discoverCount: result.discover.length,
      errorCount: result.errors.length,
      basedOnPlayedCount: result.basedOnPlayedCount,
    })
    return result
  })
}
