import { ipcRenderer, contextBridge } from 'electron'
import type { AggregatedLibrary, GamePlatform, ScanResult } from '../../shared/types/game'
import type { RecommendationsResult } from '../../shared/types/recommendations'
import type { SettingsApi, SettingsState, SettingsUpdate } from '../../shared/types/settings'
import type { PsnE2eFixture } from '../scanners/psn/e2e'

let scanAllImpl: () => Promise<AggregatedLibrary> = () => ipcRenderer.invoke('games:scan-all')
let getRecommendationsImpl: () => Promise<RecommendationsResult> = () =>
  ipcRenderer.invoke('games:get-recommendations')

const gameApi = {
  getLibrary: (): Promise<AggregatedLibrary | null> => ipcRenderer.invoke('games:get-library'),
  scanAll: (): Promise<AggregatedLibrary> => scanAllImpl(),
  enrichMetacritic: (): Promise<{ started: true }> => ipcRenderer.invoke('games:enrich-metacritic'),
  scanPlatform: (platform: GamePlatform): Promise<ScanResult> =>
    ipcRenderer.invoke('games:scan-platform', platform),
  getRecommendations: (): Promise<RecommendationsResult> => getRecommendationsImpl(),
}

const settingsApi: SettingsApi = {
  get: (): Promise<SettingsState> => ipcRenderer.invoke('settings:get'),
  update: (update: SettingsUpdate): Promise<SettingsState> =>
    ipcRenderer.invoke('settings:update', update),
}

contextBridge.exposeInMainWorld('gameApi', gameApi)
contextBridge.exposeInMainWorld('settingsApi', settingsApi)
contextBridge.exposeInMainWorld('__e2e', {
  setScanAllMock(result: AggregatedLibrary | null) {
    scanAllImpl = result
      ? () => Promise.resolve(result)
      : () => ipcRenderer.invoke('games:scan-all')
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
  setRecommendationsMock(result: RecommendationsResult | null) {
    getRecommendationsImpl = result
      ? () => Promise.resolve(result)
      : () => ipcRenderer.invoke('games:get-recommendations')
  },
})

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // You can expose other APTs you need here.
  // ...
})

// --------- Preload scripts loading ---------
function domReady(condition: DocumentReadyState[] = ['complete', 'interactive']) {
  return new Promise((resolve) => {
    if (condition.includes(document.readyState)) {
      resolve(true)
    } else {
      document.addEventListener('readystatechange', () => {
        if (condition.includes(document.readyState)) {
          resolve(true)
        }
      })
    }
  })
}

const safeDOM = {
  append(parent: HTMLElement, child: HTMLElement) {
    if (!Array.from(parent.children).find((e) => e === child)) {
      return parent.appendChild(child)
    }
  },
  remove(parent: HTMLElement, child: HTMLElement) {
    if (Array.from(parent.children).find((e) => e === child)) {
      return parent.removeChild(child)
    }
  },
}

/**
 * https://tobiasahlin.com/spinkit
 * https://connoratherton.com/loaders
 * https://projects.lukehaas.me/css-loaders
 * https://matejkustec.github.io/SpinThatShit
 */
function useLoading() {
  const className = `loaders-css__square-spin`
  const styleContent = `
@keyframes square-spin {
  25% { transform: perspective(100px) rotateX(180deg) rotateY(0); }
  50% { transform: perspective(100px) rotateX(180deg) rotateY(180deg); }
  75% { transform: perspective(100px) rotateX(0) rotateY(180deg); }
  100% { transform: perspective(100px) rotateX(0) rotateY(0); }
}
.${className} > div {
  animation-fill-mode: both;
  width: 50px;
  height: 50px;
  background: #fff;
  animation: square-spin 3s 0s cubic-bezier(0.09, 0.57, 0.49, 0.9) infinite;
}
.app-loading-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #282c34;
  z-index: 9;
}
    `
  const oStyle = document.createElement('style')
  const oDiv = document.createElement('div')

  oStyle.id = 'app-loading-style'
  oStyle.innerHTML = styleContent
  oDiv.className = 'app-loading-wrap'
  oDiv.innerHTML = `<div class="${className}"><div></div></div>`

  return {
    appendLoading() {
      safeDOM.append(document.head, oStyle)
      safeDOM.append(document.body, oDiv)
    },
    removeLoading() {
      safeDOM.remove(document.head, oStyle)
      safeDOM.remove(document.body, oDiv)
    },
  }
}

// ----------------------------------------------------------------------

const { appendLoading, removeLoading } = useLoading()
domReady().then(appendLoading)

window.onmessage = (ev) => {
  ev.data.payload === 'removeLoading' && removeLoading()
}

setTimeout(removeLoading, 4999)
