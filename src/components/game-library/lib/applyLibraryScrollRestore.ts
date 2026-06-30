import { findGameIndex, type LibraryScrollRestoreState } from './libraryScrollRestore'

type ScrollRestoreTarget = {
  scrollElement: HTMLElement
  scrollToIndex: (index: number) => void
}

export function applyLibraryScrollRestore(
  games: { key: string }[],
  scrollRestore: LibraryScrollRestoreState,
  target: ScrollRestoreTarget,
): void {
  const { scrollElement, scrollToIndex } = target
  if (games.length === 0) return

  if (scrollRestore.scrollTop > 0) {
    scrollElement.scrollTop = scrollRestore.scrollTop
  }

  const gameLink = scrollElement.querySelector<HTMLElement>(
    `[data-testid="game-link-${CSS.escape(scrollRestore.gameKey)}"]`,
  )
  if (gameLink) return

  const gameIndex = findGameIndex(games, scrollRestore.gameKey)
  if (gameIndex >= 0) {
    scrollToIndex(gameIndex)
  }
}
