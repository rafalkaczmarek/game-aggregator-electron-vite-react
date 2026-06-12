export interface SettingsState {
  steamApiKeySet: boolean
}

export interface SettingsUpdate {
  steamApiKey?: string
}

export interface SettingsApi {
  get: () => Promise<SettingsState>
  update: (update: SettingsUpdate) => Promise<SettingsState>
}
