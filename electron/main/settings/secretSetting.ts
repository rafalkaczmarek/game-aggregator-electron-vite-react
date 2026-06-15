import { decryptSecret, encryptSecret } from './secrets'
import { readStoredSettings, writeStoredSettings } from './persistence'
import type { StoredSettings } from './types'

function firstEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]?.trim()
    if (value) return value
  }
  return undefined
}

interface SecretSettingConfig {
  envVars: string[]
  readEncrypted: (stored: StoredSettings) => string | undefined
  writeEncrypted: (stored: StoredSettings, encrypted: string | undefined) => void
}

function createSecretSetting(config: SecretSettingConfig) {
  let cached: string | undefined | null = null

  async function get(): Promise<string | undefined> {
    const fromEnv = firstEnv(...config.envVars)
    if (fromEnv) return fromEnv

    if (cached !== null) {
      return cached || undefined
    }

    const stored = await readStoredSettings()
    const encrypted = config.readEncrypted(stored)
    if (!encrypted) {
      cached = undefined
      return undefined
    }

    try {
      cached = decryptSecret(encrypted).trim() || undefined
    } catch {
      cached = undefined
    }

    return cached
  }

  async function update(value: string | undefined): Promise<void> {
    const trimmed = value?.trim() ?? ''
    const stored = await readStoredSettings()

    if (!trimmed) {
      config.writeEncrypted(stored, undefined)
      cached = undefined
    } else {
      config.writeEncrypted(stored, encryptSecret(trimmed))
      cached = trimmed
    }

    await writeStoredSettings(stored)
  }

  return { get, update }
}

export const steamApiKey = createSecretSetting({
  envVars: ['STEAM_API_KEY'],
  readEncrypted: (stored) => stored.steamApiKeyEnc,
  writeEncrypted: (stored, encrypted) => {
    if (encrypted) {
      stored.steamApiKeyEnc = encrypted
    } else {
      delete stored.steamApiKeyEnc
    }
  },
})

export const githubPat = createSecretSetting({
  envVars: ['GITHUB_MODELS_PAT', 'GITHUB_TOKEN', 'GH_TOKEN'],
  readEncrypted: (stored) =>
    stored.githubPatEnc ?? stored.geminiApiKeyEnc ?? stored.openAiApiKeyEnc,
  writeEncrypted: (stored, encrypted) => {
    delete stored.geminiApiKeyEnc
    delete stored.openAiApiKeyEnc
    if (encrypted) {
      stored.githubPatEnc = encrypted
    } else {
      delete stored.githubPatEnc
    }
  },
})

export const psnNpsso = createSecretSetting({
  envVars: ['PSN_NPSSO'],
  readEncrypted: (stored) => stored.psnNpssoEnc,
  writeEncrypted: (stored, encrypted) => {
    if (encrypted) {
      stored.psnNpssoEnc = encrypted
    } else {
      delete stored.psnNpssoEnc
    }
  },
})
