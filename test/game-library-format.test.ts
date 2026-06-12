import { describe, expect, it } from 'vitest'
import { formatPlaytime, sortGamesByTitle } from '@src/components/game-library/format'
import { sampleGames } from './fixtures/games'

describe('game library format helpers', () => {
  describe('formatPlaytime', () => {
    it('returns Not played for missing or zero playtime', () => {
      expect(formatPlaytime()).toBe('Not played')
      expect(formatPlaytime(0)).toBe('Not played')
      expect(formatPlaytime(-5)).toBe('Not played')
    })

    it('formats minutes under one hour', () => {
      expect(formatPlaytime(45)).toBe('45 min')
    })

    it('formats fractional hours below ten hours', () => {
      expect(formatPlaytime(125)).toBe('2.1 hrs')
    })

    it('rounds whole hours at ten hours or more', () => {
      expect(formatPlaytime(600)).toBe('10 hrs')
      expect(formatPlaytime(615)).toBe('10 hrs')
    })
  })

  describe('sortGamesByTitle', () => {
    it('sorts games alphabetically without mutating the source array', () => {
      const sorted = sortGamesByTitle(sampleGames)

      expect(sorted.map((game) => game.title)).toEqual(['Alan Wake', 'Cyberpunk 2077', 'Dota 2'])
      expect(sampleGames.map((game) => game.title)).toEqual(['Dota 2', 'Cyberpunk 2077', 'Alan Wake'])
    })
  })
})
