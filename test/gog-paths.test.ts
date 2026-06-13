import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

const fixtureDb = path.join(import.meta.dirname, 'fixtures', 'gog', 'galaxy-2.0.db')

const { defaultGalaxyDbCandidates, findGalaxyDbPath, setE2eGalaxyDbPath } =
  await import('../electron/scanners/gog/paths')

describe('gog paths', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns null when no candidate database exists', async () => {
    await expect(findGalaxyDbPath(['/missing/galaxy-2.0.db'])).resolves.toBeNull()
  })

  it('finds the first existing candidate path', async () => {
    await expect(findGalaxyDbPath(['/missing/galaxy-2.0.db', fixtureDb])).resolves.toBe(fixtureDb)
  })

  it('prefers e2e override path when configured', async () => {
    vi.stubEnv('E2E_TEST', '1')
    setE2eGalaxyDbPath(fixtureDb)

    expect(defaultGalaxyDbCandidates()[0]).toBe(fixtureDb)

    setE2eGalaxyDbPath(null)
    vi.unstubAllEnvs()
  })

  it('rejects e2e override outside e2e mode', () => {
    expect(() => setE2eGalaxyDbPath(fixtureDb)).toThrow(
      'GOG Galaxy DB override is only available in E2E tests',
    )
  })

  it('builds windows candidate paths', () => {
    vi.stubEnv('ProgramData', 'D:\\ProgramData')
    const platformSpy = vi.spyOn(process, 'platform', 'get').mockReturnValue('win32')

    expect(defaultGalaxyDbCandidates()).toContain(
      path.join('D:\\ProgramData', 'GOG.com', 'Galaxy', 'storage', 'galaxy-2.0.db'),
    )

    platformSpy.mockRestore()
    vi.unstubAllEnvs()
  })

  it('builds macOS candidate paths', () => {
    const platformSpy = vi.spyOn(process, 'platform', 'get').mockReturnValue('darwin')

    expect(defaultGalaxyDbCandidates()).toContain(
      path.join('/Users/Shared/GOG.com/Galaxy/Storage', 'galaxy-2.0.db'),
    )

    platformSpy.mockRestore()
  })

  it('builds linux candidate paths', () => {
    const platformSpy = vi.spyOn(process, 'platform', 'get').mockReturnValue('linux')

    expect(defaultGalaxyDbCandidates()[0]).toMatch(
      /[\\/]\.config[\\/]GOG\.com[\\/]Galaxy[\\/]storage[\\/]galaxy-2\.0\.db$/,
    )

    platformSpy.mockRestore()
  })
})
