/// <reference types="vite/client" />

export {}

declare global {
  interface Window {
    gameApi: import('@shared/types/game').GameApi
    settingsApi: import('@shared/types/settings').SettingsApi
    ipcRenderer: import('electron').IpcRenderer
  }
}
