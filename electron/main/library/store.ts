import { app } from 'electron'
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { AggregatedLibrary } from '@shared/types/game'
import { createScopedLogger } from '../../lib/logger'

const logger = createScopedLogger('library')

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
    if (!isAggregatedLibrary(parsed)) {
      logger.warn('Cached library has invalid shape')
      return null
    }
    logger.debug('Cached library loaded', {
      gameCount: parsed.games.length,
      scannedAt: parsed.scannedAt,
    })
    return parsed
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      logger.warn('Failed to read cached library', error)
    }
    return null
  }
}

export async function writeCachedLibrary(library: AggregatedLibrary): Promise<void> {
  const filePath = libraryFilePath()
  const tempPath = `${filePath}.tmp`
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(tempPath, `${JSON.stringify(library, null, 2)}\n`, 'utf8')
  await rename(tempPath, filePath)
  logger.info('Cached library written', {
    gameCount: library.games.length,
    scannedAt: library.scannedAt,
  })
}

export async function clearCachedLibrary(): Promise<void> {
  await rm(libraryFilePath(), { force: true })
  logger.info('Cached library cleared')
}
