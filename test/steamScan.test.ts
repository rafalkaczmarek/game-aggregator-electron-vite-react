import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fixturesDir = path.join(import.meta.dirname, 'fixtures', 'steam')
const steamRoot = path.join(fixturesDir, 'steam-root')

const findSteamPath = vi.fn(async () => steamRoot)
const getSteamAppsDirs = vi.fn(async () => [path.join(fixturesDir)])
const getMostRecentSteamId = vi.fn(async () => '76561198000000000')
const getSteamApiKey = vi.fn(async () => undefined as string | undefined)
const enrichFromSteamWebApi = vi.fn(async () => undefined)

vi.mock('../electron/scanners/steam/paths', () => ({
  findSteamPath,
  getSteamAppsDirs,
  getMostRecentSteamId,
}))
vi.mock('../electron/main/settings/store', () => ({
  getSteamApiKey,
}))
vi.mock('../electron/scanners/steam/api', () => ({
  enrichFromSteamWebApi,
}))

const { scanSteam } = await import('../electron/scanners/steam')

describe('scanSteam', () => {
  beforeEach(() => {
    findSteamPath.mockReset()
    findSteamPath.mockResolvedValue(steamRoot)
    getSteamApiKey.mockReset()
    getSteamApiKey.mockResolvedValue(undefined)
    enrichFromSteamWebApi.mockReset()
    enrichFromSteamWebApi.mockResolvedValue(undefined)
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string | URL) => {
        const appId = String(url).match(/appids=(\d+)/)?.[1]
        if (!appId) {
          return { ok: true, json: async () => ({}) }
        }
        return {
          ok: true,
          json: async () => ({
            [appId]: { success: true, data: { name: `Resolved ${appId}` } },
          }),
        }
      }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns error when steam installation is missing', async () => {
    findSteamPath.mockResolvedValueOnce(null as unknown as string)

    const result = await scanSteam()

    expect(result).toEqual({
      platform: 'steam',
      games: [],
      errors: ['Steam installation not found'],
    })
  })

  it('aggregates local games and enriches from api when key is configured', async () => {
    getSteamApiKey.mockResolvedValue('api-key')

    const result = await scanSteam()

    expect(result.platform).toBe('steam')
    expect(result.errors).toEqual([])
    expect(result.games.some((game) => game.title === 'Dota 2')).toBe(true)
    expect(enrichFromSteamWebApi).toHaveBeenCalledWith(
      'api-key',
      '76561198000000000',
      expect.any(Map),
    )
    expect(result.games.map((game) => game.title)).toEqual(
      [...result.games.map((game) => game.title)].sort(),
    )
  })

  it('records api failures without aborting scan', async () => {
    getSteamApiKey.mockResolvedValue('api-key')
    enrichFromSteamWebApi.mockRejectedValue(new Error('network down'))

    const result = await scanSteam()

    expect(result.games.length).toBeGreaterThan(0)
    expect(result.errors).toContain('Steam Web API failed: network down')
  })
})
