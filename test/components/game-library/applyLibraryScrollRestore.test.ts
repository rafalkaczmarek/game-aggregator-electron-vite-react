import { describe, expect, it, vi } from 'vitest'
import { applyLibraryScrollRestore } from '@src/components/game-library/lib/applyLibraryScrollRestore'
import type { LibraryScrollRestoreState } from '@src/components/game-library/lib/libraryScrollRestore'

const baseRestore: LibraryScrollRestoreState = {
  viewMode: 'grid',
  scrollTop: 0,
  gameKey: 'dota 2',
  searchQuery: '',
  selectedPlatforms: [],
  playStatus: 'all',
  librarySort: 'title',
}

describe('applyLibraryScrollRestore', () => {
  it('restores saved scrollTop', () => {
    const scrollElement = document.createElement('div')
    const link = document.createElement('a')
    link.setAttribute('data-testid', 'game-link-dota 2')
    scrollElement.appendChild(link)
    const scrollToIndex = vi.fn()

    applyLibraryScrollRestore([{ key: 'dota 2' }], { ...baseRestore, scrollTop: 420 }, {
      scrollElement,
      scrollToIndex,
    })

    expect(scrollElement.scrollTop).toBe(420)
    expect(scrollToIndex).not.toHaveBeenCalled()
  })

  it('skips scrollToIndex when the game link is already rendered', () => {
    const scrollElement = document.createElement('div')
    const link = document.createElement('a')
    link.setAttribute('data-testid', 'game-link-dota 2')
    scrollElement.appendChild(link)
    const scrollToIndex = vi.fn()

    applyLibraryScrollRestore([{ key: 'dota 2' }, { key: 'alan wake' }], baseRestore, {
      scrollElement,
      scrollToIndex,
    })

    expect(scrollToIndex).not.toHaveBeenCalled()
  })

  it('scrolls to the game index when the link is not in the DOM', () => {
    const scrollElement = document.createElement('div')
    const scrollToIndex = vi.fn()

    applyLibraryScrollRestore(
      [{ key: 'dota 2' }, { key: 'alan wake' }],
      { ...baseRestore, gameKey: 'alan wake' },
      { scrollElement, scrollToIndex },
    )

    expect(scrollToIndex).toHaveBeenCalledWith(1)
  })

  it('does nothing for an empty game list', () => {
    const scrollElement = document.createElement('div')
    const scrollToIndex = vi.fn()

    applyLibraryScrollRestore([], { ...baseRestore, scrollTop: 100 }, {
      scrollElement,
      scrollToIndex,
    })

    expect(scrollElement.scrollTop).toBe(0)
    expect(scrollToIndex).not.toHaveBeenCalled()
  })
})
