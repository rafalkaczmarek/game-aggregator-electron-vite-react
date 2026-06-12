import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

const fixtureDb = path.join(import.meta.dirname, 'fixtures', 'gog', 'galaxy-2.0.db')

const findGalaxyDbPath = vi.fn<() => Promise<string | null>>(async () => fixtureDb)

vi.mock('../electron/scanners/gog/paths', () => ({
  findGalaxyDbPath,
  defaultGalaxyDbCandidates: vi.fn(() => [fixtureDb]),
}))

const { scanGog } = await import('../electron/scanners/gog')

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
})
