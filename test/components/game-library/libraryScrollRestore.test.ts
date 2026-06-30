import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  consumeLibraryScrollRestore,
  findGameIndex,
  saveLibraryScrollRestore,
  type LibraryScrollRestoreState,
} from '@src/components/game-library/lib/libraryScrollRestore'

const sampleState: LibraryScrollRestoreState = {
  viewMode: 'list',
  scrollTop: 420,
  gameKey: 'dota 2',
  searchQuery: 'dota',
  selectedPlatforms: ['steam'],
  playStatus: 'played',
  librarySort: 'title',
}

describe('libraryScrollRestore', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('saves and consumes scroll restore state once', () => {
    saveLibraryScrollRestore(sampleState)

    expect(consumeLibraryScrollRestore()).toEqual(sampleState)
    expect(consumeLibraryScrollRestore()).toBeNull()
  })

  it('finds a game index by normalized key', () => {
    const games = [{ key: 'dota 2' }, { key: 'alan wake' }]

    expect(findGameIndex(games, 'alan wake')).toBe(1)
    expect(findGameIndex(games, 'missing')).toBe(-1)
  })

  it('ignores sessionStorage write failures', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })

    expect(() => saveLibraryScrollRestore(sampleState)).not.toThrow()

    setItem.mockRestore()
  })

  it('returns null when stored restore payload is invalid json', () => {
    sessionStorage.setItem('game-library-scroll-restore', '{not-json')

    expect(consumeLibraryScrollRestore()).toBeNull()
    expect(sessionStorage.getItem('game-library-scroll-restore')).toBeNull()
  })
})
