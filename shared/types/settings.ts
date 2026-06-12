export interface SettingsState {
  steamApiKeySet: boolean
  psnNpssoSet: boolean
  psnOnlineId?: string
}

export interface SettingsUpdate {
  steamApiKey?: string
  psnNpsso?: string
  psnOnlineId?: string
}

export interface SettingsApi {
  get: () => Promise<SettingsState>
  update: (update: SettingsUpdate) => Promise<SettingsState>
}
