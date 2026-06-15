import { app } from 'electron'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { StoredSettings } from './types'

function settingsFilePath(): string {
  return path.join(app.getPath('userData'), 'settings.json')
}

export async function readStoredSettings(): Promise<StoredSettings> {
  try {
    const raw = await readFile(settingsFilePath(), 'utf8')
    return JSON.parse(raw) as StoredSettings
  } catch {
    return {}
  }
}

export async function writeStoredSettings(settings: StoredSettings): Promise<void> {
  await mkdir(path.dirname(settingsFilePath()), { recursive: true })
  await writeFile(settingsFilePath(), `${JSON.stringify(settings, null, 2)}\n`, 'utf8')
}
