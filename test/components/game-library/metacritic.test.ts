import { describe, expect, it } from 'vitest'
import {
  formatMetascore,
  formatUserScore,
  getMetascoreTier,
  getUserScoreTier,
  hasAnyScore,
} from '@src/components/game-library/lib/metacritic'

describe('metacritic score helpers', () => {
  it('classifies metascore tiers', () => {
    expect(getMetascoreTier(undefined)).toBe('unknown')
    expect(getMetascoreTier(Number.NaN)).toBe('unknown')
    expect(getMetascoreTier(75)).toBe('positive')
    expect(getMetascoreTier(74)).toBe('mixed')
    expect(getMetascoreTier(50)).toBe('mixed')
    expect(getMetascoreTier(49)).toBe('negative')
  })

  it('classifies user score tiers', () => {
    expect(getUserScoreTier(undefined)).toBe('unknown')
    expect(getUserScoreTier(7.5)).toBe('positive')
    expect(getUserScoreTier(7.4)).toBe('mixed')
    expect(getUserScoreTier(5)).toBe('mixed')
    expect(getUserScoreTier(4.9)).toBe('negative')
  })

  it('formats scores for display', () => {
    expect(formatMetascore(undefined)).toBe('–')
    expect(formatMetascore(92.4)).toBe('92')
    expect(formatUserScore(undefined)).toBe('–')
    expect(formatUserScore(8.06)).toBe('8.1')
  })

  it('detects when a rating has any score', () => {
    expect(hasAnyScore(undefined)).toBe(false)
    expect(hasAnyScore({ fetchedAt: '2024-01-01T00:00:00.000Z' })).toBe(false)
    expect(hasAnyScore({ metascore: 90, fetchedAt: '2024-01-01T00:00:00.000Z' })).toBe(true)
    expect(hasAnyScore({ userScore: 8.5, fetchedAt: '2024-01-01T00:00:00.000Z' })).toBe(true)
  })
})
