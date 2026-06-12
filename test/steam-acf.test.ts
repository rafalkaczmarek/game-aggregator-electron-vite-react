import path from 'node:path'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchStoreAppName,
  mergeLocalApps,
  readLocalConfigApps,
  resolveMissingNames,
  scanAcfDirectory,
} from '../electron/scanners/steam/acf'
import { asRecord, asString } from '../electron/scanners/steam/vdf'

const fixturesDir = path.join(import.meta.dirname, 'fixtures', 'steam')
const steamRoot = path.join(fixturesDir, 'steam-root')
const tmpAcfDir = path.join(import.meta.dirname, '.tmp-steam-acf')

describe('steam acf helpers', () => {
  beforeEach(async () => {
    await mkdir(tmpAcfDir, { recursive: true })
  })

  afterEach(async () => {
    await rm(tmpAcfDir, { recursive: true, force: true })
    vi.unstubAllGlobals()
  })

  it('marks installed games from StateFlags', async () => {
    await writeFile(
      path.join(tmpAcfDir, 'appmanifest_730.acf'),
      await readFile(path.join(fixturesDir, 'appmanifest_730_uninstalled.acf'), 'utf8'),
    )

    const games = new Map()
    const errors: string[] = []

    await scanAcfDirectory(fixturesDir, games, errors)
    await scanAcfDirectory(tmpAcfDir, games, errors)

    expect(games.get('570')?.installed).toBe(true)
    expect(games.get('730')?.installed).toBe(false)
    expect(errors).toHaveLength(0)
  })

  it('skips manifests without a title', async () => {
    await writeFile(
      path.join(tmpAcfDir, 'appmanifest_999.acf'),
      '"AppState"\n{\n\t"appid"\t\t"999"\n}\n',
      'utf8',
    )

    const games = new Map()
    const errors: string[] = []
    await scanAcfDirectory(tmpAcfDir, games, errors)

    expect(games.size).toBe(0)
    expect(errors).toHaveLength(0)
  })

  it('reads playtime from localconfig and merges missing apps', async () => {
    const localApps = await readLocalConfigApps(steamRoot, '76561198000000000')
    const games = new Map<string, import('@shared/types/game').Game>()

    games.set('570', {
      id: 'steam-570',
      platform: 'steam',
      title: 'Dota 2',
      installed: true,
      sourceId: '570',
    })

    const missing = mergeLocalApps(games, localApps)

    expect(games.get('570')?.playtimeMinutes).toBe(90)
    expect(missing).toEqual(['999'])
    expect(games.get('999')).toMatchObject({
      title: 'Steam App 999',
      installed: false,
      playtimeMinutes: 15,
    })
  })

  it('resolves missing names from store api', async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      const appId = String(url).match(/appids=(\d+)/)?.[1]
      return {
        ok: true,
        json: async () => ({
          [appId!]: { success: true, data: { name: `Resolved ${appId}` } },
        }),
      }
    })
    vi.stubGlobal('fetch', fetchMock)

    const games = new Map<string, import('@shared/types/game').Game>([
      [
        '999',
        {
          id: 'steam-999',
          platform: 'steam',
          title: 'Steam App 999',
          installed: false,
          sourceId: '999',
        },
      ],
    ])
    const errors: string[] = []

    await resolveMissingNames(games, ['999'], errors)

    expect(games.get('999')?.title).toBe('Resolved 999')
    expect(errors).toHaveLength(0)
    expect(fetchMock).toHaveBeenCalled()
  })

  it('fetchStoreAppName returns null when store api fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false })))

    await expect(fetchStoreAppName('123')).resolves.toBeNull()
  })

  it('reports unresolved names after failed store lookups', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false })))

    const games = new Map<string, import('@shared/types/game').Game>([
      [
        '999',
        {
          id: 'steam-999',
          platform: 'steam',
          title: 'Steam App 999',
          installed: false,
          sourceId: '999',
        },
      ],
    ])
    const errors: string[] = []

    await resolveMissingNames(games, ['999'], errors)

    expect(errors[0]).toContain('Could not resolve names for 1 Steam app(s)')
  })
})

describe('vdf helpers', () => {
  it('coerces records and strings safely', () => {
    expect(asRecord(['not', 'record'])).toBeUndefined()
    expect(asRecord({ key: 'value' })).toEqual({ key: 'value' })
    expect(asString(42)).toBe('42')
    expect(asString(undefined)).toBeUndefined()
  })
})
