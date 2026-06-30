import { contextBridge } from 'electron'
import { createE2eBridge } from './e2eBridge'
import { gameApi } from './gameApi'
import { exposeIpcRendererBridge } from './ipcRendererBridge'
import { initLoadingScreen } from './loading'
import { settingsApi } from './settingsApi'

contextBridge.exposeInMainWorld('gameApi', gameApi)
contextBridge.exposeInMainWorld('settingsApi', settingsApi)
contextBridge.exposeInMainWorld('__e2e', createE2eBridge())

exposeIpcRendererBridge()
initLoadingScreen()
