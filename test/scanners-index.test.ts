import path from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Game, ScanResult } from '@shared/types/game'

const fixtureDb = path.join(import.meta.dirname, 'fixtures', 'gog', 'galaxy-2.0.db')

const scanSteam = vi.fn<() => Promise<ScanResult>>()
const scanGog = vi.fn<() => Promise<ScanResult>>()
const scanEpic = vi.fn<() => Promise<ScanResult>>()
const scanPsn = vi.fn<() => Promise<ScanResult>>()
const findGalaxyDbPath = vi.fn<() => Promise<string | null>>(async () => null)

vi.mock('../electron/scanners/steam', () => ({ scanSteam }))
vi.mock('../electron/scanners/gog', () => ({ scanGog }))
vi.mock('../electron/scanners/epic', () => ({ scanEpic }))
vi.mock('../electron/scanners/psn', () => ({ scanPsn }))
vi.mock('../electron/scanners/gog/paths', () => ({ findGalaxyDbPath }))

const { scanPlatform, scanAllGames } = await import('../electron/scanners')

function stubResult(platform: ScanResult['platform'], title: string): ScanResult {
  return {
    platform,
    games: [{ id: `${platform}-1`, platform, title, installed: false, sourceId: '1' }],
    errors: [],
  }
}

describe('scanner aggregator', () => {
  beforeEach(() => {
    scanSteam.mockReset()
    scanGog.mockReset()
    scanEpic.mockReset()
    scanPsn.mockReset()
    findGalaxyDbPath.mockReset()
    findGalaxyDbPath.mockResolvedValue(null)

    scanSteam.mockResolvedValue(stubResult('steam', 'Steam Game'))
    scanGog.mockResolvedValue(stubResult('gog', 'GOG Game'))
    scanEpic.mockResolvedValue(stubResult('epic', 'Epic Game'))
    scanPsn.mockResolvedValue(stubResult('psn', 'PSN Game'))
  })

  it('delegates scanPlatform to the matching scanner', async () => {
    await expect(scanPlatform('gog')).resolves.toMatchObject({ platform: 'gog' })
    expect(scanGog).toHaveBeenCalledTimes(1)
    expect(scanSteam).not.toHaveBeenCalled()
  })

  it('merges all platform results in scanAllGames when GOG database is missing', async () => {
    const library = await scanAllGames()

    expect(findGalaxyDbPath).toHaveBeenCalledTimes(1)
    expect(scanSteam).toHaveBeenCalledTimes(1)
    expect(scanGog).toHaveBeenCalledTimes(1)
    expect(scanEpic).toHaveBeenCalledTimes(1)
    expect(scanPsn).toHaveBeenCalledTimes(1)
    expect(library.games).toHaveLength(4)
    expect(library.results).toHaveLength(4)
    expect(library.scannedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('loads games from GOG Galaxy database and falls back for missing platforms', async () => {
    findGalaxyDbPath.mockResolvedValue(fixtureDb)

    const library = await scanAllGames()

    expect(findGalaxyDbPath).toHaveBeenCalledTimes(1)
    expect(scanGog).not.toHaveBeenCalled()
    expect(scanSteam).not.toHaveBeenCalled()
    expect(scanEpic).toHaveBeenCalledTimes(1)
    expect(scanPsn).toHaveBeenCalledTimes(1)
    expect(library.games).toHaveLength(5)
    expect(library.results).toHaveLength(4)

    const gogResult = library.results.find((result) => result.platform === 'gog')
    const steamResult = library.results.find((result) => result.platform === 'steam')
    const epicResult = library.results.find((result) => result.platform === 'epic')
    const psnResult = library.results.find((result) => result.platform === 'psn')

    expect(gogResult?.games).toHaveLength(2)
    expect(steamResult?.games).toEqual([
      expect.objectContaining<Game>({
        id: 'steam-570',
        platform: 'steam',
        title: 'Dota 2',
        installed: false,
        sourceId: '570',
      }),
    ])
    expect(epicResult?.games[0]?.title).toBe('Epic Game')
    expect(psnResult?.games[0]?.title).toBe('PSN Game')
  })
})
