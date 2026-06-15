import { ipcMain } from 'electron'
import type { SettingsUpdate } from '../../../shared/types/settings'
import {
  getSettingsState,
  updateGithubPat,
  updatePsnNpsso,
  updatePsnOnlineId,
  updateSteamApiKey,
} from '../settings/store'

export function registerSettingsIpcHandlers(): void {
  ipcMain.handle('settings:get', () => getSettingsState())

  ipcMain.handle('settings:update', async (_event, update: SettingsUpdate) => {
    if (update.steamApiKey !== undefined) {
      await updateSteamApiKey(update.steamApiKey)
    }
    if (update.githubPat !== undefined) {
      await updateGithubPat(update.githubPat)
    }
    if (update.psnNpsso !== undefined) {
      await updatePsnNpsso(update.psnNpsso)
    }
    if (update.psnOnlineId !== undefined) {
      await updatePsnOnlineId(update.psnOnlineId)
    }
    return getSettingsState()
  })
}
