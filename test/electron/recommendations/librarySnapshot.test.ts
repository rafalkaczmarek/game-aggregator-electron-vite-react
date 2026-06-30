import { describe, expect, it } from 'vitest'
import {
  buildLibrarySnapshot,
  findLibraryMatch,
  findUnplayedMatch,
  isOwnedTitle,
} from '@electron/recommendations/librarySnapshot'
import { recommendationGames } from '@test/fixtures/recommendationGames'

describe('library snapshot', () => {
  it('groups played and unplayed titles', () => {
    const snapshot = buildLibrarySnapshot(recommendationGames)

    expect(snapshot.played).toHaveLength(2)
    expect(snapshot.unplayed).toHaveLength(1)
    expect(snapshot.unplayed[0]?.title).toBe('Cyberpunk 2077')
    expect(snapshot.played[0]?.title).toBe('Dota 2')
  })

  it('matches unplayed titles fuzzily', () => {
    const snapshot = buildLibrarySnapshot(recommendationGames)
    expect(findUnplayedMatch('cyberpunk 2077', snapshot.unplayed)?.title).toBe('Cyberpunk 2077')
  })

  it('finds library matches for played and unplayed titles', () => {
    const snapshot = buildLibrarySnapshot(recommendationGames)

    expect(findLibraryMatch('Cyberpunk 2077', snapshot)?.playtimeMinutes).toBe(0)
    expect(findLibraryMatch('Dota 2', snapshot)?.playtimeMinutes).toBe(6000)
    expect(findLibraryMatch('Hades', snapshot)).toBeUndefined()
  })

  it('detects owned titles', () => {
    const snapshot = buildLibrarySnapshot(recommendationGames)
    expect(isOwnedTitle('Dota 2', snapshot.ownedTitles)).toBe(true)
    expect(isOwnedTitle("Baldur's Gate 3", snapshot.ownedTitles)).toBe(false)
  })
})
