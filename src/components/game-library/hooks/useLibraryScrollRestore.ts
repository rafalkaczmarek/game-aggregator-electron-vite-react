import { useCallback, useLayoutEffect, type RefObject } from 'react'
import type { Virtualizer } from '@tanstack/react-virtual'
import { applyLibraryScrollRestore } from '../lib/applyLibraryScrollRestore'
import type { LibraryScrollRestoreState } from '../lib/libraryScrollRestore'

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
      applyLibraryScrollRestore(games, scrollRestore, { scrollElement, scrollToIndex })

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
