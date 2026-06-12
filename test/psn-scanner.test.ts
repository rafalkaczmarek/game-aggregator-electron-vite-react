import { beforeEach, describe, expect, it, vi } from 'vitest'

const getPsnNpsso = vi.fn<() => Promise<string | undefined>>()
const getPsnOnlineId = vi.fn<() => Promise<string | undefined>>()
const authenticateWithNpsso = vi.fn()
const resolveAccountId = vi.fn()
const fetchAllPurchasedGames = vi.fn()
const fetchAllUserTitles = vi.fn()

vi.mock('../electron/main/settings/store', () => ({
  getPsnNpsso,
  getPsnOnlineId,
}))

vi.mock('../electron/scanners/psn/auth', () => ({
  authenticateWithNpsso,
}))

vi.mock('../electron/scanners/psn/api', () => ({
  resolveAccountId,
  fetchAllPurchasedGames,
  fetchAllUserTitles,
}))

describe('scanPsn', () => {
  beforeEach(() => {
    getPsnNpsso.mockReset()
    getPsnOnlineId.mockReset()
    authenticateWithNpsso.mockReset()
    resolveAccountId.mockReset()
    fetchAllPurchasedGames.mockReset()
    fetchAllUserTitles.mockReset()
  })

  it('returns an error when NPSSO is not configured', async () => {
    vi.resetModules()
    getPsnNpsso.mockResolvedValue(undefined)

    const { scanPsn } = await import('../electron/scanners/psn')
    const result = await scanPsn()

    expect(result).toEqual({
      platform: 'psn',
      games: [],
      errors: ['PSN NPSSO token not configured. Add it in Settings or set PSN_NPSSO.'],
    })
  })

  it('loads purchased games for the authenticated account by default', async () => {
    vi.resetModules()
    getPsnNpsso.mockResolvedValue('npsso-token')
    getPsnOnlineId.mockResolvedValue(undefined)
    authenticateWithNpsso.mockResolvedValue({ accessToken: 'access-token' })
    fetchAllPurchasedGames.mockResolvedValue([
      {
        titleId: 'PPSA01411_00',
        entitlementId: 'ENT123',
        name: "Marvel's Spider-Man: Miles Morales",
        image: { url: 'https://example.com/miles.png' },
      },
    ])

    const { scanPsn } = await import('../electron/scanners/psn')
    const result = await scanPsn()

    expect(authenticateWithNpsso).toHaveBeenCalledWith('npsso-token')
    expect(fetchAllPurchasedGames).toHaveBeenCalledWith({ accessToken: 'access-token' })
    expect(fetchAllUserTitles).not.toHaveBeenCalled()
    expect(resolveAccountId).not.toHaveBeenCalled()
    expect(result.platform).toBe('psn')
    expect(result.errors).toEqual([])
    expect(result.games).toEqual([
      expect.objectContaining({
        id: 'psn-PPSA01411_00',
        title: "Marvel's Spider-Man: Miles Morales",
        platform: 'psn',
      }),
    ])
  })

  it('loads trophy titles when scanning a public online id', async () => {
    vi.resetModules()
    getPsnNpsso.mockResolvedValue('npsso-token')
    getPsnOnlineId.mockResolvedValue('public-player')
    authenticateWithNpsso.mockResolvedValue({ accessToken: 'access-token' })
    resolveAccountId.mockResolvedValue('account-123')
    fetchAllUserTitles.mockResolvedValue([
      {
        npCommunicationId: 'NPWR20188_00',
        trophyTitleName: "Astro's Playroom",
        trophyTitleIconUrl: 'https://example.com/astro.png',
      },
    ])

    const { scanPsn } = await import('../electron/scanners/psn')
    const result = await scanPsn()

    expect(fetchAllPurchasedGames).not.toHaveBeenCalled()
    expect(resolveAccountId).toHaveBeenCalledWith(
      { accessToken: 'access-token' },
      'public-player',
    )
    expect(fetchAllUserTitles).toHaveBeenCalledWith({ accessToken: 'access-token' }, 'account-123')
    expect(result.games).toEqual([
      expect.objectContaining({
        id: 'psn-NPWR20188_00',
        title: "Astro's Playroom",
      }),
    ])
  })

  it('returns API errors without throwing', async () => {
    vi.resetModules()
    getPsnNpsso.mockResolvedValue('npsso-token')
    getPsnOnlineId.mockResolvedValue(undefined)
    authenticateWithNpsso.mockRejectedValue(new Error('invalid npsso'))

    const { scanPsn } = await import('../electron/scanners/psn')
    const result = await scanPsn()

    expect(result).toEqual({
      platform: 'psn',
      games: [],
      errors: ['PSN scan failed: invalid npsso'],
    })
  })
})
