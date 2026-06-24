import { app } from 'electron'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { MetacriticRating } from '../../../shared/types/game'
import { createScopedLogger } from '../../lib/logger'

const logger = createScopedLogger('metacritic:cache')

/** Hits become stale after 30 days — review scores barely move past initial release. */
const DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000

/** Negative results (no Metacritic page) live shorter so newly added games are retried. */
const MISS_TTL_MS = 7 * 24 * 60 * 60 * 1000

interface CacheEntry {
  /** Cached rating; `null` is a "negative" entry meaning we tried and found nothing. */
  rating: MetacriticRating | null
  fetchedAt: string
}

interface CacheFile {
  version: number
  entries: Record<string, CacheEntry>
}

const CACHE_VERSION = 1

function cacheFilePath(): string {
  return path.join(app.getPath('userData'), 'metacritic-cache.json')
}

let memoryCache: CacheFile | null = null

function freshFile(): CacheFile {
  return { version: CACHE_VERSION, entries: {} }
}

async function load(): Promise<CacheFile> {
  if (memoryCache) return memoryCache
  try {
    const raw = await readFile(cacheFilePath(), 'utf8')
    const parsed = JSON.parse(raw) as CacheFile
    if (parsed.version !== CACHE_VERSION || !parsed.entries) {
      memoryCache = freshFile()
      return memoryCache
    }
    memoryCache = parsed
    return parsed
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      logger.warn('Failed to read metacritic cache — starting fresh', error)
    }
    memoryCache = freshFile()
    return memoryCache
  }
}

async function persist(): Promise<void> {
  if (!memoryCache) return
  const filePath = cacheFilePath()
  const tempPath = `${filePath}.tmp`
  try {
    await mkdir(path.dirname(filePath), { recursive: true })
    await writeFile(tempPath, `${JSON.stringify(memoryCache, null, 2)}\n`, 'utf8')
    await rename(tempPath, filePath)
  } catch (error) {
    logger.warn('Failed to persist metacritic cache', error)
  }
}

function isFresh(entry: CacheEntry): boolean {
  const fetchedAt = Date.parse(entry.fetchedAt)
  if (!Number.isFinite(fetchedAt)) return false
  const ttl = entry.rating ? DEFAULT_TTL_MS : MISS_TTL_MS
  return Date.now() - fetchedAt < ttl
}

export async function getCached(key: string): Promise<MetacriticRating | null | undefined> {
  const file = await load()
  const entry = file.entries[key]
  if (!entry || !isFresh(entry)) return undefined
  return entry.rating
}

export async function setCached(key: string, rating: MetacriticRating | null): Promise<void> {
  const file = await load()
  file.entries[key] = { rating, fetchedAt: new Date().toISOString() }
  await persist()
}

/** Clears the in-memory cache (useful for tests). */
export function _resetCacheForTesting(): void {
  memoryCache = null
}
