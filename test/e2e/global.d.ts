export {}

declare global {
  interface Window {
    gameApi: import('../../shared/types/game').GameApi
    settingsApi: import('../../shared/types/settings').SettingsApi
    __e2e: {
      setScanAllMock: (result: import('../../shared/types/game').AggregatedLibrary | null) => void
      writeLibraryCache: (
        library: import('../../shared/types/game').AggregatedLibrary,
      ) => Promise<void>
      clearLibraryCache: () => Promise<void>
      setGogGalaxyDbPath: (dbPath: string | null) => Promise<void>
      setPsnFixture: (
        fixture: import('../../electron/scanners/psn/e2e').PsnE2eFixture | null,
      ) => Promise<void>
      setRecommendationsMock: (
        result: import('../../shared/types/recommendations').RecommendationsResult | null,
      ) => void
      setEnrichMetacriticMock: (
        result: import('../../shared/types/game').AggregatedLibrary | null,
      ) => void
      setEnrichMetacriticFromCacheMode: (enabled: boolean) => void
      writeMetacriticCache: (cache: import('../../electron/metadata/metacritic/cache').MetacriticCacheFile) => Promise<void>
      clearMetacriticCache: () => Promise<void>
      getMetacriticApiCallCount: () => Promise<number>
    }
  }
}
