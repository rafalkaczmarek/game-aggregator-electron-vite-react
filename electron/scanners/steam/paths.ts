import { execFile } from 'node:child_process'
import { access } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { asRecord, asString, readVdfFile } from './vdf'

const execFileAsync = promisify(execFile)

function normalizeVdfPath(folderPath: string): string {
  return folderPath.replace(/\\\\/g, '\\')
}

const WINDOWS_STEAM_CANDIDATES = [
  path.join(process.env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)', 'Steam'),
  path.join(process.env.ProgramFiles ?? 'C:\\Program Files', 'Steam'),
]

async function pathExists(target: string): Promise<boolean> {
  try {
    await access(target)
    return true
  } catch {
    return false
  }
}

async function readSteamPathFromRegistry(): Promise<string | null> {
  if (process.platform !== 'win32') return null

  const keys = [
    'HKCU\\Software\\Valve\\Steam',
    'HKLM\\SOFTWARE\\WOW6432Node\\Valve\\Steam',
    'HKLM\\SOFTWARE\\Valve\\Steam',
  ]

  for (const key of keys) {
    try {
      const { stdout } = await execFileAsync('reg', ['query', key, '/v', 'SteamPath'])
      const match = stdout.match(/SteamPath\s+REG_\w+\s+(.+)/i)
      const steamPath = match?.[1]?.trim()
      if (steamPath && (await pathExists(steamPath))) return steamPath
    } catch {
      // try next key
    }
  }

  return null
}

function defaultSteamCandidates(): string[] {
  const home = os.homedir()

  switch (process.platform) {
    case 'win32':
      return WINDOWS_STEAM_CANDIDATES
    case 'darwin':
      return [path.join(home, 'Library', 'Application Support', 'Steam')]
    default:
      return [
        path.join(home, '.steam', 'root'),
        path.join(home, '.local', 'share', 'Steam'),
        path.join(home, '.steam', 'steam'),
      ]
  }
}

export async function findSteamPath(): Promise<string | null> {
  const fromRegistry = await readSteamPathFromRegistry()
  if (fromRegistry) return fromRegistry

  for (const candidate of defaultSteamCandidates()) {
    if (await pathExists(candidate)) return candidate
  }

  return null
}

export async function getSteamAppsDirs(steamPath: string): Promise<string[]> {
  const dirs = new Set<string>([path.join(steamPath, 'steamapps')])

  const libraryFoldersPath = path.join(steamPath, 'steamapps', 'libraryfolders.vdf')
  if (!(await pathExists(libraryFoldersPath))) {
    return [...dirs]
  }

  try {
    const data = await readVdfFile(libraryFoldersPath)
    const libraryFolders = asRecord(data.libraryfolders) ?? asRecord(data.LibraryFolders)
    if (!libraryFolders) return [...dirs]

    for (const entry of Object.values(libraryFolders)) {
      const folder = asRecord(entry)
      const folderPath = asString(folder?.path)
      if (!folderPath) continue
      dirs.add(path.join(normalizeVdfPath(folderPath), 'steamapps'))
    }
  } catch {
    // default steamapps dir is enough
  }

  return [...dirs]
}

export async function getMostRecentSteamId(steamPath: string): Promise<string | null> {
  const loginUsersPath = path.join(steamPath, 'config', 'loginusers.vdf')
  if (!(await pathExists(loginUsersPath))) return null

  try {
    const data = await readVdfFile(loginUsersPath)
    const users = asRecord(data.users)
    if (!users) return null

    for (const [steamId, userData] of Object.entries(users)) {
      const user = asRecord(userData)
      if (asString(user?.MostRecent) === '1') return steamId
    }

    const firstId = Object.keys(users)[0]
    return firstId ?? null
  } catch {
    return null
  }
}
