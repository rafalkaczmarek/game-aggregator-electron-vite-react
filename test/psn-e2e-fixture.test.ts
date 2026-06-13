import { afterEach, describe, expect, it, vi } from 'vitest'

const { getE2ePsnFixture, setE2ePsnFixture } = await import('../electron/scanners/psn/e2e')

describe('psn e2e fixture', () => {
  afterEach(() => {
    vi.stubEnv('E2E_TEST', '1')
    setE2ePsnFixture(null)
    vi.unstubAllEnvs()
  })

  it('stores and returns fixture data in e2e mode', () => {
    vi.stubEnv('E2E_TEST', '1')
    const fixture = { accountId: 'account-123' }

    setE2ePsnFixture(fixture)
    expect(getE2ePsnFixture()).toEqual(fixture)

    setE2ePsnFixture(null)
    expect(getE2ePsnFixture()).toBeUndefined()
  })

  it('rejects fixture override outside e2e mode', () => {
    expect(() => setE2ePsnFixture({ accountId: 'account-123' })).toThrow(
      'PSN fixture override is only available in E2E tests',
    )
  })
})
