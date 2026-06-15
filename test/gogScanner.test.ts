import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { readGogGalaxyLibrary, readGogLibrary } from '../electron/scanners/gog/db'
import { findGalaxyDbPath } from '../electron/scanners/gog/paths'

const fixtureDb = path.join(import.meta.dirname, 'fixtures', 'gog', 'galaxy-2.0.db')

describe('gog scanner', () => {
  it('finds an existing galaxy database path', async () => {
    await expect(findGalaxyDbPath([fixtureDb])).resolves.toBe(fixtureDb)
  })

  it('reads owned GOG games from the galaxy database', () => {
    const games = readGogLibrary(fixtureDb)

    expect(games).toHaveLength(2)
    expect(games[0]).toMatchObject({
      id: 'gog-gog_1495134320',
      platform: 'gog',
      title: 'Cyberpunk 2077',
      coverUrl: 'https://images.gog.com/hash_glx_vertical_cover.webp?namespace=gamesdb',
      playtimeMinutes: 42,
      installed: false,
      sourceId: '1495134320',
    })
    expect(games[1]).toMatchObject({
      id: 'gog-gog_1207658924',
      platform: 'gog',
      title: 'The Witcher 3: Wild Hunt',
      coverUrl: 'https://example.com/witcher3.jpg',
      playtimeMinutes: 183,
      installed: true,
      sourceId: '1207658924',
    })
  })

  it('reads games from all supported platforms in the galaxy database', () => {
    const byPlatform = readGogGalaxyLibrary(fixtureDb)

    expect(byPlatform.gog).toHaveLength(2)
    expect(byPlatform.steam).toEqual([
      expect.objectContaining({
        id: 'steam-570',
        platform: 'steam',
        title: 'Dota 2',
        sourceId: '570',
      }),
    ])
    expect(byPlatform.epic).toBeUndefined()
    expect(byPlatform.psn).toBeUndefined()
  })
})
