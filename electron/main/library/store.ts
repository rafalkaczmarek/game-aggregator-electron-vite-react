import { app } from 'electron'
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { AggregatedLibrary } from '@shared/types/game'

function libraryFilePath(): string {
  return path.join(app.getPath('userData'), 'library.json')
}

function isAggregatedLibrary(value: unknown): value is AggregatedLibrary {
  if (!value || typeof value !== 'object') return false
  const library = value as AggregatedLibrary
  return (
    Array.isArray(library.games) &&
    typeof library.scannedAt === 'string' &&
    Array.isArray(library.results)
  )
}

export async function readCachedLibrary(): Promise<AggregatedLibrary | null> {
  try {
    const raw = await readFile(libraryFilePath(), 'utf8')
    const parsed: unknown = JSON.parse(raw)
    return isAggregatedLibrary(parsed) ? parsed : null
  } catch {
    return null
  }
}

export async function writeCachedLibrary(library: AggregatedLibrary): Promise<void> {
  const filePath = libraryFilePath()
  const tempPath = `${filePath}.tmp`
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(tempPath, `${JSON.stringify(library, null, 2)}\n`, 'utf8')
  await rename(tempPath, filePath)
}

export async function clearCachedLibrary(): Promise<void> {
  await rm(libraryFilePath(), { force: true })
}
