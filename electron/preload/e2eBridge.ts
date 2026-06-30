import { ipcRenderer } from 'electron'
import type { AggregatedLibrary } from '../../shared/types/game'
import type { PsnE2eFixture } from '../scanners/psn/e2e'
import {
  configureEnrichMetacriticFromCacheMode,
  configureEnrichMetacriticMock,
  configureGameDescriptionMock,
  configureRecommendationsMock,
  configureScanAllMock,
  getLastRecommendationsOptions,
  resetLastRecommendationsOptions,
  type RecommendationsE2eMock,
} from './gameApi'

export function createE2eBridge() {
  return {
    setScanAllMock(result: AggregatedLibrary | null) {
      configureScanAllMock(result)
    },
    writeLibraryCache(library: AggregatedLibrary) {
      return ipcRenderer.invoke('e2e:write-library-cache', library)
    },
    clearLibraryCache() {
      return ipcRenderer.invoke('e2e:clear-library-cache')
    },
    setGogGalaxyDbPath(dbPath: string | null) {
      return ipcRenderer.invoke('e2e:set-gog-galaxy-db', dbPath)
    },
    setPsnFixture(fixture: PsnE2eFixture | null) {
      return ipcRenderer.invoke('e2e:set-psn-fixture', fixture)
    },
    setRecommendationsMock(mock: RecommendationsE2eMock) {
      configureRecommendationsMock(mock)
    },
    setGameDescriptionMock(description: import('../../shared/types/game').GameDescription | null) {
      configureGameDescriptionMock(description)
    },
    resetGameDescriptionMock() {
      configureGameDescriptionMock(undefined)
    },
    getLastRecommendationsOptions,
    resetLastRecommendationsOptions,
    setEnrichMetacriticMock(result: AggregatedLibrary | null) {
      configureEnrichMetacriticMock(result)
    },
    setEnrichMetacriticFromCacheMode(enabled: boolean) {
      configureEnrichMetacriticFromCacheMode(enabled)
    },
    writeMetacriticCache(cache: unknown) {
      return ipcRenderer.invoke('e2e:write-metacritic-cache', cache)
    },
    clearMetacriticCache() {
      return ipcRenderer.invoke('e2e:clear-metacritic-cache')
    },
    getMetacriticApiCallCount() {
      return ipcRenderer.invoke('e2e:get-metacritic-api-call-count') as Promise<number>
    },
  }
}
