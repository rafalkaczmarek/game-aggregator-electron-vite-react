import { ipcMain } from 'electron'
import type { SettingsUpdate } from '../../../shared/types/settings'
import { getSettingsState, updateSteamApiKey } from '../settings/store'

export function registerSettingsIpcHandlers(): void {
  ipcMain.handle('settings:get', () => getSettingsState())

  ipcMain.handle('settings:update', async (_event, update: SettingsUpdate) => {
    if (update.steamApiKey !== undefined) {
      await updateSteamApiKey(update.steamApiKey)
    }
    return getSettingsState()
  })
}
