import { readStoredSettings, writeStoredSettings } from './persistence'

function firstEnv(name: string): string | undefined {
  return process.env[name]?.trim() || undefined
}

function createPlainSetting(envVar: string, storageKey: 'psnOnlineId') {
  let cached: string | undefined | null = null

  async function get(): Promise<string | undefined> {
    const fromEnv = firstEnv(envVar)
    if (fromEnv) return fromEnv

    if (cached !== null) {
      return cached || undefined
    }

    const stored = await readStoredSettings()
    cached = stored[storageKey]?.trim() || undefined
    return cached
  }

  async function update(value: string | undefined): Promise<void> {
    const trimmed = value?.trim() ?? ''
    const stored = await readStoredSettings()

    if (!trimmed) {
      delete stored[storageKey]
      cached = undefined
    } else {
      stored[storageKey] = trimmed
      cached = trimmed
    }

    await writeStoredSettings(stored)
  }

  return { get, update }
}

export const psnOnlineId = createPlainSetting('PSN_ONLINE_ID', 'psnOnlineId')
