import { access } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const DB_FILE = 'galaxy-2.0.db'

let e2eGalaxyDbPath: string | undefined

export function setE2eGalaxyDbPath(dbPath: string | null): void {
  if (process.env.E2E_TEST !== '1') {
    throw new Error('GOG Galaxy DB override is only available in E2E tests')
  }
  e2eGalaxyDbPath = dbPath ?? undefined
}

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

function platformGalaxyDbCandidates(): string[] {
  switch (process.platform) {
    case 'win32':
      return [windowsGalaxyDbPath()]
    case 'darwin':
      return [macGalaxyDbPath()]
    default:
      return [linuxGalaxyDbPath()]
  }
}

export function defaultGalaxyDbCandidates(): string[] {
  const candidates = e2eGalaxyDbPath ? [e2eGalaxyDbPath] : []
  return [...candidates, ...platformGalaxyDbCandidates()]
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
