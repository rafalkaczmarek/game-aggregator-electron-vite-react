import { ipcMain } from 'electron'
import type { AggregatedLibrary } from '../../../shared/types/game'
import { createScopedLogger } from '../../lib/logger'
import {
  getE2eMetacriticApiCallCount,
  resetE2eMetacriticApiCallCount,
} from '../../metadata/metacritic/api'
import {
  clearMetacriticCache,
  replaceMetacriticCache,
  type MetacriticCacheFile,
} from '../../metadata/metacritic/cache'
import { setE2eGalaxyDbPath } from '../../scanners/gog/paths'
import { setE2ePsnFixture, type PsnE2eFixture } from '../../scanners/psn/e2e'
import { clearCachedLibrary, readCachedLibrary, writeCachedLibrary } from '../library/store'
import { simulateMetacriticEnrichment, startMetacriticEnrichment } from './metacriticEnrichment'

const logger = createScopedLogger('ipc:games-e2e')

function requireCachedLibrary(): Promise<AggregatedLibrary> {
  return readCachedLibrary().then((library) => {
    if (!library || library.games.length === 0) {
      throw new Error('No library to enrich — scan your libraries first.')
    }
    return library
  })
}

export function registerGamesE2eIpcHandlers(): void {
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
  ipcMain.handle('e2e:write-metacritic-cache', (_event, cache: MetacriticCacheFile) =>
    replaceMetacriticCache(cache),
  )
  ipcMain.handle('e2e:clear-metacritic-cache', () => clearMetacriticCache())
  ipcMain.handle('e2e:reset-metacritic-api-call-count', () => {
    resetE2eMetacriticApiCallCount()
  })
  ipcMain.handle('e2e:get-metacritic-api-call-count', () => getE2eMetacriticApiCallCount())
  ipcMain.handle('e2e:enrich-metacritic-cached', async () => {
    const library = await requireCachedLibrary()

    resetE2eMetacriticApiCallCount()
    logger.info('e2e:enrich-metacritic-cached invoked', { gameCount: library.games.length })
    startMetacriticEnrichment(library)
    return { started: true as const }
  })
  ipcMain.handle('e2e:simulate-metacritic-enrichment', (_event, enriched: AggregatedLibrary) =>
    simulateMetacriticEnrichment(enriched),
  )
}
