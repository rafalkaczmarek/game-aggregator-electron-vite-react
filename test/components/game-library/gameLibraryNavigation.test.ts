import { describe, expect, it } from 'vitest'
import { findGroupedGameByKey } from '@src/components/game-library/lib/grouping'
import { gameDetailPath } from '@src/components/game-library/lib/paths'
import { groupGamesByTitle } from '@src/components/game-library/lib/format'
import { sampleGames } from '@test/fixtures/games'

describe('game library navigation helpers', () => {
  const groupedGames = groupGamesByTitle(sampleGames)

  it('builds an encoded detail path from a grouped game key', () => {
    const cyberpunk = groupedGames.find((game) => game.title === 'Cyberpunk 2077')!

    expect(gameDetailPath(cyberpunk)).toBe('/library/cyberpunk%202077')
  })

  it('finds a grouped game by normalized key', () => {
    const games = sampleGames

    expect(findGroupedGameByKey(games, 'dota 2')?.title).toBe('Dota 2')
    expect(findGroupedGameByKey(games, 'missing-game')).toBeUndefined()
  })
})
