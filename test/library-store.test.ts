import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockLibrary } from './fixtures/games'

const tmpDir = path.join(import.meta.dirname, '.tmp-library-store')

vi.mock('electron', () => ({
  app: {
    getPath: () => tmpDir,
  },
}))

const { readCachedLibrary, writeCachedLibrary } = await import('../electron/main/library/store')

describe('library store', () => {
  beforeEach(async () => {
    await mkdir(tmpDir, { recursive: true })
  })

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  it('returns null when cache file is missing', async () => {
    await expect(readCachedLibrary()).resolves.toBeNull()
  })

  it('returns null for invalid cache payload', async () => {
    await writeFile(path.join(tmpDir, 'library.json'), '{"games":"bad"}', 'utf8')

    await expect(readCachedLibrary()).resolves.toBeNull()
  })

  it('writes and reads aggregated library', async () => {
    const library = createMockLibrary()

    await writeCachedLibrary(library)
    await expect(readCachedLibrary()).resolves.toEqual(library)

    const raw = await readFile(path.join(tmpDir, 'library.json'), 'utf8')
    expect(JSON.parse(raw)).toEqual(library)
  })
})
