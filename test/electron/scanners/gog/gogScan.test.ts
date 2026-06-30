import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fixturePath } from '@test/helpers/paths'

const fixtureDb = fixturePath('gog', 'galaxy-2.0.db')

const findGalaxyDbPath = vi.fn<() => Promise<string | null>>(async () => fixtureDb)

vi.mock('@electron/scanners/gog/paths', () => ({
  findGalaxyDbPath,
  defaultGalaxyDbCandidates: vi.fn(() => [fixtureDb]),
}))

const { scanGog } = await import('@electron/scanners/gog')

describe('scanGog', () => {
  afterEach(() => {
    findGalaxyDbPath.mockReset()
    findGalaxyDbPath.mockResolvedValue(fixtureDb)
  })

  it('returns GOG games from the galaxy database', async () => {
    const result = await scanGog()

    expect(findGalaxyDbPath).toHaveBeenCalledTimes(1)
    expect(result.platform).toBe('gog')
    expect(result.errors).toEqual([])
    expect(result.games).toHaveLength(2)
    expect(result.games.some((game) => game.title === 'The Witcher 3: Wild Hunt')).toBe(true)
  })

  it('reports a missing database', async () => {
    findGalaxyDbPath.mockResolvedValueOnce(null)

    const result = await scanGog()

    expect(result).toEqual({
      platform: 'gog',
      games: [],
      errors: ['GOG Galaxy database not found'],
    })
  })

  it('reports database read failures', async () => {
    findGalaxyDbPath.mockResolvedValueOnce('/tmp/missing-galaxy.db')

    const result = await scanGog()

    expect(result.platform).toBe('gog')
    expect(result.games).toEqual([])
    expect(result.errors[0]).toMatch(/^GOG Galaxy database read failed:/)
  })
})
