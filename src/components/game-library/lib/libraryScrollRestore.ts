import type { GamePlatform } from '@shared/types/game'
import type { LibrarySort, PlayStatusFilter } from './types'
import type { LibraryViewMode } from '../ui/ViewToggle'

const STORAGE_KEY = 'game-library-scroll-restore'

export type LibraryScrollRestoreState = {
  viewMode: LibraryViewMode
  scrollTop: number
  gameKey: string
  searchQuery: string
  selectedPlatforms: GamePlatform[]
  playStatus: PlayStatusFilter
  librarySort: LibrarySort
}

export function saveLibraryScrollRestore(state: LibraryScrollRestoreState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Ignore quota / private-mode errors — navigation still works without restore.
  }
}

export function consumeLibraryScrollRestore(): LibraryScrollRestoreState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    sessionStorage.removeItem(STORAGE_KEY)
    return JSON.parse(raw) as LibraryScrollRestoreState
  } catch {
    sessionStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function findGameIndex(games: { key: string }[], gameKey: string): number {
  return games.findIndex((game) => game.key === gameKey)
}
