import { ipcRenderer } from 'electron'
import type { SettingsApi, SettingsState, SettingsUpdate } from '../../shared/types/settings'

export const settingsApi: SettingsApi = {
  get: (): Promise<SettingsState> => ipcRenderer.invoke('settings:get'),
  update: (update: SettingsUpdate): Promise<SettingsState> =>
    ipcRenderer.invoke('settings:update', update),
}
