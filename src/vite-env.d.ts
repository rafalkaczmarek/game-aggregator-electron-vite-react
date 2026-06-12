/// <reference types="vite/client" />

export {}

declare global {
  interface Window {
    gameApi: import('@shared/types/game').GameApi
    ipcRenderer: import('electron').IpcRenderer
  }
}
