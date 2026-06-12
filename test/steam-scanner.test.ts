import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { scanAcfDirectory } from '../electron/scanners/steam/acf'
import { getMostRecentSteamId, getSteamAppsDirs } from '../electron/scanners/steam/paths'
import { asRecord, asString, readVdfFile } from '../electron/scanners/steam/vdf'

const fixturesDir = path.join(import.meta.dirname, 'fixtures', 'steam')
const steamRoot = path.join(fixturesDir, 'steam-root')

describe('steam scanner', () => {
  it('parses libraryfolders.vdf', async () => {
    const data = await readVdfFile(path.join(fixturesDir, 'libraryfolders.vdf'))
    const folders = asRecord(data.libraryfolders)
    expect(asString(asRecord(folders?.['1'])?.path)).toContain('SteamLibrary')
  })

  it('returns only default steamapps dir when libraryfolders.vdf is missing', async () => {
    const dirs = await getSteamAppsDirs(path.join(fixturesDir, 'missing-steam'))
    expect(dirs).toEqual([path.join(fixturesDir, 'missing-steam', 'steamapps')])
  })

  it('collects steamapps dirs from libraryfolders.vdf', async () => {
    const dirs = await getSteamAppsDirs(steamRoot)
    expect(dirs).toContain(path.join(steamRoot, 'steamapps'))
    expect(dirs.some((dir) => dir.endsWith(`${path.sep}SteamLibrary${path.sep}steamapps`))).toBe(true)
  })

  it('reads most recent steam id from loginusers.vdf', async () => {
    await expect(getMostRecentSteamId(steamRoot)).resolves.toBe('76561198000000000')
  })

  it('reads installed games from appmanifest acf files', async () => {
    const games = new Map()
    const errors: string[] = []

    await scanAcfDirectory(fixturesDir, games, errors)

    expect(errors).toHaveLength(0)
    expect(games.get('570')).toMatchObject({
      id: 'steam-570',
      platform: 'steam',
      title: 'Dota 2',
      installed: true,
      sourceId: '570',
    })
  })
})
