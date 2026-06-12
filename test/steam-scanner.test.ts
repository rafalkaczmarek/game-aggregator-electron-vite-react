import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { scanAcfDirectory } from '../electron/scanners/steam/acf'
import { getSteamAppsDirs } from '../electron/scanners/steam/paths'
import { asRecord, asString, readVdfFile } from '../electron/scanners/steam/vdf'

const fixturesDir = path.join(import.meta.dirname, 'fixtures', 'steam')

describe('steam scanner', () => {
  it('parses libraryfolders.vdf', async () => {
    const data = await readVdfFile(path.join(fixturesDir, 'libraryfolders.vdf'))
    const folders = asRecord(data.libraryfolders)
    expect(asString(asRecord(folders?.['1'])?.path)).toContain('SteamLibrary')
  })

  it('collects steamapps dirs from libraryfolders.vdf', async () => {
    const steamPath = path.join(fixturesDir, 'steam-root')
    const dirs = await getSteamAppsDirs(steamPath)
    expect(dirs).toContain(path.join(steamPath, 'steamapps'))
    expect(dirs.some((dir) => dir.endsWith(`${path.sep}SteamLibrary${path.sep}steamapps`))).toBe(true)
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
