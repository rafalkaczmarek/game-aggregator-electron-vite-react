import { readdir } from 'node:fs/promises'
import path from 'node:path'
import type { Game } from '../../../shared/types/game'
import { asRecord, asString, readVdfFile } from './vdf'

const FULLY_INSTALLED_FLAG = 4

function isFullyInstalled(stateFlags: number): boolean {
  return (stateFlags & FULLY_INSTALLED_FLAG) === FULLY_INSTALLED_FLAG
}

function parseStateFlags(value: unknown): number {
  const text = asString(value)
  if (!text) return 0
  const parsed = Number.parseInt(text, 10)
  return Number.isFinite(parsed) ? parsed : 0
}

function steamCoverUrl(appId: string): string {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`
}

function toSteamGame(appId: string, title: string, installed: boolean, playtimeMinutes?: number): Game {
  return {
    id: `steam-${appId}`,
    platform: 'steam',
    title,
    coverUrl: steamCoverUrl(appId),
    playtimeMinutes,
    installed,
    sourceId: appId,
  }
}

export async function scanAcfDirectory(
  steamAppsDir: string,
  games: Map<string, Game>,
  errors: string[],
): Promise<void> {
  let entries: string[]
  try {
    entries = await readdir(steamAppsDir)
  } catch {
    return
  }

  const manifests = entries.filter((name) => name.startsWith('appmanifest_') && name.endsWith('.acf'))

  for (const manifestName of manifests) {
    const manifestPath = path.join(steamAppsDir, manifestName)
    try {
      const data = await readVdfFile(manifestPath)
      const appState = asRecord(data.AppState)
      const appId = asString(appState?.appid) ?? manifestName.match(/appmanifest_(\d+)\.acf/)?.[1]
      const title = asString(appState?.name)

      if (!appId || !title) continue

      const stateFlags = parseStateFlags(appState?.StateFlags)
      const installed = isFullyInstalled(stateFlags)

      games.set(appId, toSteamGame(appId, title, installed))
    } catch (error) {
      errors.push(`Failed to parse ${manifestPath}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

export interface LocalAppInfo {
  playtimeMinutes?: number
}

export async function readLocalConfigApps(
  steamPath: string,
  steamId: string,
): Promise<Map<string, LocalAppInfo>> {
  const localConfigPath = path.join(steamPath, 'userdata', steamId, 'config', 'localconfig.vdf')
  const apps = new Map<string, LocalAppInfo>()

  try {
    const data = await readVdfFile(localConfigPath)
    const store = asRecord(data.UserLocalConfigStore)
    const software = asRecord(store?.Software) ?? asRecord(store?.software)
    const valve = asRecord(software?.Valve) ?? asRecord(software?.valve)
    const steam = asRecord(valve?.Steam) ?? asRecord(valve?.steam)
    const appSection = asRecord(steam?.Apps) ?? asRecord(steam?.apps)
    if (!appSection) return apps

    for (const [appId, appData] of Object.entries(appSection)) {
      const app = asRecord(appData)
      const playtimeText = asString(app?.Playtime) ?? asString(app?.playtime)
      const playtime = playtimeText ? Number.parseInt(playtimeText, 10) : undefined

      apps.set(appId, {
        playtimeMinutes: Number.isFinite(playtime) ? playtime : undefined,
      })
    }
  } catch {
    // localconfig is optional
  }

  return apps
}

export function mergeLocalApps(
  games: Map<string, Game>,
  localApps: Map<string, LocalAppInfo>,
): string[] {
  const missingNames: string[] = []

  for (const [appId, info] of localApps) {
    const existing = games.get(appId)
    if (existing) {
      if (info.playtimeMinutes !== undefined) {
        games.set(appId, { ...existing, playtimeMinutes: info.playtimeMinutes })
      }
      continue
    }

    games.set(
      appId,
      toSteamGame(appId, `Steam App ${appId}`, false, info.playtimeMinutes),
    )
    missingNames.push(appId)
  }

  return missingNames
}

export async function fetchStoreAppName(appId: string): Promise<string | null> {
  const url = `https://store.steampowered.com/api/appdetails?appids=${appId}&l=english`

  try {
    const response = await fetch(url)
    if (!response.ok) return null

    const payload = (await response.json()) as Record<string, { success?: boolean; data?: { name?: string } }>
    const entry = payload[appId]
    if (!entry?.success || !entry.data?.name) return null
    return entry.data.name
  } catch {
    return null
  }
}

export async function resolveMissingNames(
  games: Map<string, Game>,
  appIds: string[],
  errors: string[],
): Promise<void> {
  const batchSize = 5

  for (let index = 0; index < appIds.length; index += batchSize) {
    const batch = appIds.slice(index, index + batchSize)
    await Promise.all(
      batch.map(async (appId) => {
        const name = await fetchStoreAppName(appId)
        if (!name) return

        const game = games.get(appId)
        if (!game) return

        games.set(appId, { ...game, title: name })
      }),
    )
  }

  const unresolved = appIds.filter((appId) => games.get(appId)?.title.startsWith('Steam App '))
  if (unresolved.length > 0) {
    errors.push(`Could not resolve names for ${unresolved.length} Steam app(s) via Store API`)
  }
}
