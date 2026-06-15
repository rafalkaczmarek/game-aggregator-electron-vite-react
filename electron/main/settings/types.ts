export interface StoredSettings {
  steamApiKeyEnc?: string
  openAiApiKeyEnc?: string
  geminiApiKeyEnc?: string
  githubPatEnc?: string
  psnNpssoEnc?: string
  psnOnlineId?: string
}

export interface SettingsState {
  steamApiKeySet: boolean
  githubPatSet: boolean
  psnNpssoSet: boolean
  psnOnlineId?: string
}
