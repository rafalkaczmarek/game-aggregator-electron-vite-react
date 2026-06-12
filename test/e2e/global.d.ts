export {}

declare global {
  interface Window {
    gameApi: import('../../shared/types/game').GameApi
    settingsApi: import('../../shared/types/settings').SettingsApi
    __e2e: {
      setScanAllMock: (result: import('../../shared/types/game').AggregatedLibrary | null) => void
    }
  }
}
