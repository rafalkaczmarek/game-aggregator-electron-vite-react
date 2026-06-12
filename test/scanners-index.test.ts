import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ScanResult } from '@shared/types/game'

const scanSteam = vi.fn<() => Promise<ScanResult>>()
const scanGog = vi.fn<() => Promise<ScanResult>>()
const scanEpic = vi.fn<() => Promise<ScanResult>>()
const scanPsn = vi.fn<() => Promise<ScanResult>>()

vi.mock('../electron/scanners/steam', () => ({ scanSteam }))
vi.mock('../electron/scanners/gog', () => ({ scanGog }))
vi.mock('../electron/scanners/epic', () => ({ scanEpic }))
vi.mock('../electron/scanners/psn', () => ({ scanPsn }))

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

  it('merges all platform results in scanAllGames', async () => {
    const library = await scanAllGames()

    expect(scanSteam).toHaveBeenCalledTimes(1)
    expect(scanGog).toHaveBeenCalledTimes(1)
    expect(scanEpic).toHaveBeenCalledTimes(1)
    expect(scanPsn).toHaveBeenCalledTimes(1)
    expect(library.games).toHaveLength(4)
    expect(library.results).toHaveLength(4)
    expect(library.scannedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })
})
