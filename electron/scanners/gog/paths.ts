import { access } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const DB_FILE = 'galaxy-2.0.db'

async function pathExists(target: string): Promise<boolean> {
  try {
    await access(target)
    return true
  } catch {
    return false
  }
}

function windowsGalaxyDbPath(): string {
  const programData = process.env.ProgramData ?? 'C:\\ProgramData'
  return path.join(programData, 'GOG.com', 'Galaxy', 'storage', DB_FILE)
}

function macGalaxyDbPath(): string {
  return path.join('/Users/Shared/GOG.com/Galaxy/Storage', DB_FILE)
}

function linuxGalaxyDbPath(): string {
  return path.join(os.homedir(), '.config', 'GOG.com', 'Galaxy', 'storage', DB_FILE)
}

export function defaultGalaxyDbCandidates(): string[] {
  switch (process.platform) {
    case 'win32':
      return [windowsGalaxyDbPath()]
    case 'darwin':
      return [macGalaxyDbPath()]
    default:
      return [linuxGalaxyDbPath()]
  }
}

export async function findGalaxyDbPath(
  candidates: string[] = defaultGalaxyDbCandidates(),
): Promise<string | null> {
  for (const candidate of candidates) {
    if (await pathExists(candidate)) {
      return candidate
    }
  }
  return null
}
