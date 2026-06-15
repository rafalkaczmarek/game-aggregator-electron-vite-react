export interface SettingsState {
  steamApiKeySet: boolean
  githubPatSet: boolean
  psnNpssoSet: boolean
  psnOnlineId?: string
}

export interface SettingsUpdate {
  steamApiKey?: string
  githubPat?: string
  psnNpsso?: string
  psnOnlineId?: string
}

export interface SettingsApi {
  get: () => Promise<SettingsState>
  update: (update: SettingsUpdate) => Promise<SettingsState>
}
