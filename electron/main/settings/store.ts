import { app, safeStorage } from 'electron'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

interface StoredSettings {
  steamApiKeyEnc?: string
  psnNpssoEnc?: string
  psnOnlineId?: string
}

let cachedSteamApiKey: string | undefined | null = null
let cachedPsnNpsso: string | undefined | null = null
let cachedPsnOnlineId: string | undefined | null = null

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

export async function getPsnNpsso(): Promise<string | undefined> {
  const fromEnv = process.env.PSN_NPSSO?.trim()
  if (fromEnv) return fromEnv

  if (cachedPsnNpsso !== null) {
    return cachedPsnNpsso || undefined
  }

  const stored = await readStoredSettings()
  if (!stored.psnNpssoEnc) {
    cachedPsnNpsso = undefined
    return undefined
  }

  try {
    cachedPsnNpsso = decryptSecret(stored.psnNpssoEnc).trim() || undefined
  } catch {
    cachedPsnNpsso = undefined
  }

  return cachedPsnNpsso
}

export async function getPsnOnlineId(): Promise<string | undefined> {
  const fromEnv = process.env.PSN_ONLINE_ID?.trim()
  if (fromEnv) return fromEnv

  if (cachedPsnOnlineId !== null) {
    return cachedPsnOnlineId || undefined
  }

  const stored = await readStoredSettings()
  cachedPsnOnlineId = stored.psnOnlineId?.trim() || undefined
  return cachedPsnOnlineId
}

export async function getSettingsState(): Promise<{
  steamApiKeySet: boolean
  psnNpssoSet: boolean
  psnOnlineId?: string
}> {
  const [key, npsso, onlineId] = await Promise.all([
    getSteamApiKey(),
    getPsnNpsso(),
    getPsnOnlineId(),
  ])

  return {
    steamApiKeySet: Boolean(key),
    psnNpssoSet: Boolean(npsso),
    psnOnlineId: onlineId,
  }
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

export async function updatePsnNpsso(value: string | undefined): Promise<void> {
  const trimmed = value?.trim() ?? ''
  const stored = await readStoredSettings()

  if (!trimmed) {
    delete stored.psnNpssoEnc
    cachedPsnNpsso = undefined
  } else {
    stored.psnNpssoEnc = encryptSecret(trimmed)
    cachedPsnNpsso = trimmed
  }

  await writeStoredSettings(stored)
}

export async function updatePsnOnlineId(value: string | undefined): Promise<void> {
  const trimmed = value?.trim() ?? ''
  const stored = await readStoredSettings()

  if (!trimmed) {
    delete stored.psnOnlineId
    cachedPsnOnlineId = undefined
  } else {
    stored.psnOnlineId = trimmed
    cachedPsnOnlineId = trimmed
  }

  await writeStoredSettings(stored)
}
