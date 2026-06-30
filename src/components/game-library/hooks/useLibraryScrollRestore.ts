import { useCallback, useLayoutEffect, type RefObject } from 'react'
import type { Virtualizer } from '@tanstack/react-virtual'
import { findGameIndex, type LibraryScrollRestoreState } from '../lib/libraryScrollRestore'

function applyLibraryScrollRestore(
  games: { key: string }[],
  scrollRestore: LibraryScrollRestoreState,
  scrollElement: HTMLElement,
  scrollToIndex: (index: number) => void,
): void {
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

export function useLibraryScrollRestore(
  games: { key: string }[],
  scrollRestore: LibraryScrollRestoreState | null | undefined,
  scrollRef: RefObject<HTMLDivElement | null>,
  scrollToIndex: (index: number) => void,
): void {
  useLayoutEffect(() => {
    const scrollElement = scrollRef.current
    if (!scrollRestore || !scrollElement || games.length === 0) return

    const restore = () =>
      applyLibraryScrollRestore(games, scrollRestore, scrollElement, scrollToIndex)

    restore()
    const frame = requestAnimationFrame(restore)

    return () => {
      cancelAnimationFrame(frame)
    }
  }, [games, scrollRestore, scrollRef, scrollToIndex])
}

export function useLibraryGridScrollRestore(
  games: { key: string }[],
  scrollRestore: LibraryScrollRestoreState | null | undefined,
  scrollRef: RefObject<HTMLDivElement | null>,
  columnCount: number,
  rowVirtualizer: Virtualizer<HTMLUListElement, Element>,
): void {
  const scrollToGame = useCallback(
    (gameIndex: number) => {
      if (columnCount <= 0) return
      const rowIndex = Math.floor(gameIndex / columnCount)
      rowVirtualizer.scrollToIndex(rowIndex, { align: 'auto' })
    },
    [columnCount, rowVirtualizer],
  )

  useLibraryScrollRestore(games, scrollRestore, scrollRef, scrollToGame)
}
