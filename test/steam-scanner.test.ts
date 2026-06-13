import { mkdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { scanAcfDirectory } from '../electron/scanners/steam/acf'
import {
  findSteamPath,
  getMostRecentSteamId,
  getSteamAppsDirs,
} from '../electron/scanners/steam/paths'
import { asRecord, asString, readVdfFile } from '../electron/scanners/steam/vdf'

const fixturesDir = path.join(import.meta.dirname, 'fixtures', 'steam')
const steamRoot = path.join(fixturesDir, 'steam-root')
const tempSteamDir = path.join(import.meta.dirname, '.tmp-steam-paths')

describe('steam scanner', () => {
  afterEach(async () => {
    await rm(tempSteamDir, { recursive: true, force: true })
  })

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
    expect(dirs.some((dir) => dir.endsWith(`${path.sep}SteamLibrary${path.sep}steamapps`))).toBe(
      true,
    )
  })

  it('reads most recent steam id from loginusers.vdf', async () => {
    await expect(getMostRecentSteamId(steamRoot)).resolves.toBe('76561198000000000')
  })

  it('falls back to the first steam id when none is marked most recent', async () => {
    const configDir = path.join(tempSteamDir, 'config')
    await mkdir(configDir, { recursive: true })
    await writeFile(
      path.join(configDir, 'loginusers.vdf'),
      `"users"
{
\t"76561198000000001"
\t{
\t\t"PersonaName"\t\t"Other User"
\t}
\t"76561198000000002"
\t{
\t\t"PersonaName"\t\t"Second User"
\t}
}`,
      'utf8',
    )

    await expect(getMostRecentSteamId(tempSteamDir)).resolves.toBe('76561198000000001')
  })

  it('returns null when loginusers.vdf is missing', async () => {
    await expect(getMostRecentSteamId(tempSteamDir)).resolves.toBeNull()
  })

  it('ignores invalid libraryfolders.vdf and keeps default steamapps dir', async () => {
    const steamappsDir = path.join(tempSteamDir, 'steamapps')
    await mkdir(steamappsDir, { recursive: true })
    await writeFile(path.join(steamappsDir, 'libraryfolders.vdf'), 'not-valid-vdf', 'utf8')

    await expect(getSteamAppsDirs(tempSteamDir)).resolves.toEqual([steamappsDir])
  })

  it('finds steam installation from default linux paths', async () => {
    const home = path.join(tempSteamDir, 'home')
    const linuxSteamRoot = path.join(home, '.steam', 'root')
    await mkdir(linuxSteamRoot, { recursive: true })

    const homeSpy = vi.spyOn(os, 'homedir').mockReturnValue(home)
    const platformSpy = vi.spyOn(process, 'platform', 'get').mockReturnValue('linux')

    await expect(findSteamPath()).resolves.toBe(linuxSteamRoot)

    homeSpy.mockRestore()
    platformSpy.mockRestore()
  })

  it('returns null when no steam installation is found', async () => {
    const home = path.join(tempSteamDir, 'empty-home')
    await mkdir(home, { recursive: true })

    const homeSpy = vi.spyOn(os, 'homedir').mockReturnValue(home)
    const platformSpy = vi.spyOn(process, 'platform', 'get').mockReturnValue('linux')

    await expect(findSteamPath()).resolves.toBeNull()

    homeSpy.mockRestore()
    platformSpy.mockRestore()
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
