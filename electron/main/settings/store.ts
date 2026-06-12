import { app, safeStorage } from 'electron'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

interface StoredSettings {
  steamApiKeyEnc?: string
}

let cachedSteamApiKey: string | undefined | null = null

function settingsFilePath(): string {
  return path.join(app.getPath('userData'), 'settings.json')
}

function encryptSecret(value: string): string {
  if (safeStorage.isEncryptionAvailable()) {
    return safeStorage.encryptString(value).toString('base64')
  }
  return Buffer.from(value, 'utf8').toString('base64')
}

function decryptSecret(value: string): string {
  const buffer = Buffer.from(value, 'base64')
  if (safeStorage.isEncryptionAvailable()) {
    return safeStorage.decryptString(buffer)
  }
  return buffer.toString('utf8')
}

async function readStoredSettings(): Promise<StoredSettings> {
  try {
    const raw = await readFile(settingsFilePath(), 'utf8')
    return JSON.parse(raw) as StoredSettings
  } catch {
    return {}
  }
}

async function writeStoredSettings(settings: StoredSettings): Promise<void> {
  await mkdir(path.dirname(settingsFilePath()), { recursive: true })
  await writeFile(settingsFilePath(), `${JSON.stringify(settings, null, 2)}\n`, 'utf8')
}

export async function getSteamApiKey(): Promise<string | undefined> {
  const fromEnv = process.env.STEAM_API_KEY?.trim()
  if (fromEnv) return fromEnv

  if (cachedSteamApiKey !== null) {
    return cachedSteamApiKey || undefined
  }

  const stored = await readStoredSettings()
  if (!stored.steamApiKeyEnc) {
    cachedSteamApiKey = undefined
    return undefined
  }

  try {
    cachedSteamApiKey = decryptSecret(stored.steamApiKeyEnc).trim() || undefined
  } catch {
    cachedSteamApiKey = undefined
  }

  return cachedSteamApiKey
}

export async function getSettingsState(): Promise<{ steamApiKeySet: boolean }> {
  const key = await getSteamApiKey()
  return { steamApiKeySet: Boolean(key) }
}

export async function updateSteamApiKey(value: string | undefined): Promise<void> {
  const trimmed = value?.trim() ?? ''
  const stored = await readStoredSettings()

  if (!trimmed) {
    delete stored.steamApiKeyEnc
    cachedSteamApiKey = undefined
  } else {
    stored.steamApiKeyEnc = encryptSecret(trimmed)
    cachedSteamApiKey = trimmed
  }

  await writeStoredSettings(stored)
}
