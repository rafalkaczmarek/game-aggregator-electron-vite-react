import { beforeEach, describe, expect, it, vi } from 'vitest'

const exchangeNpssoForAccessCode = vi.fn()
const exchangeAccessCodeForAuthTokens = vi.fn()
const getE2ePsnFixture = vi.fn<() => unknown>()

vi.mock('psn-api', () => ({
  exchangeNpssoForAccessCode,
  exchangeAccessCodeForAuthTokens,
}))

vi.mock('../electron/scanners/psn/e2e', () => ({
  getE2ePsnFixture,
}))

const { authenticateWithNpsso } = await import('../electron/scanners/psn/auth')

describe('authenticateWithNpsso', () => {
  beforeEach(() => {
    exchangeNpssoForAccessCode.mockReset()
    exchangeAccessCodeForAuthTokens.mockReset()
    getE2ePsnFixture.mockReset()
    getE2ePsnFixture.mockReturnValue(undefined)
  })

  it('returns e2e access token when fixture override is active', async () => {
    getE2ePsnFixture.mockReturnValue({ purchasedGames: [] })

    await expect(authenticateWithNpsso('ignored')).resolves.toEqual({
      accessToken: 'e2e-access-token',
    })
    expect(exchangeNpssoForAccessCode).not.toHaveBeenCalled()
  })

  it('exchanges npsso for auth tokens', async () => {
    exchangeNpssoForAccessCode.mockResolvedValue('access-code')
    exchangeAccessCodeForAuthTokens.mockResolvedValue({
      accessToken: 'live-token',
      refreshToken: 'refresh',
    })

    await expect(authenticateWithNpsso('npsso-token')).resolves.toEqual({
      accessToken: 'live-token',
      refreshToken: 'refresh',
    })
    expect(exchangeNpssoForAccessCode).toHaveBeenCalledWith('npsso-token')
    expect(exchangeAccessCodeForAuthTokens).toHaveBeenCalledWith('access-code')
  })
})
