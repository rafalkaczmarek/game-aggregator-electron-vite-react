import { useCallback, useEffect, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import GameListRow from './GameListRow'
import { useLibraryNavigation } from '../context/LibraryNavigationContext'
import { useLibraryScrollRestore } from '../hooks/useLibraryScrollRestore'
import type { LibraryScrollRestoreState } from '../lib/libraryScrollRestore'
import { type GroupedGame } from '../lib/types'
import { observeLibraryScrollRect } from '../lib/observeLibraryScrollRect'
import { LIBRARY_SCROLL_HEIGHT_CLASS, LIST_ROW_HEIGHT } from '../lib/virtualScroll'

interface GameListViewProps {
  games: GroupedGame[]
  scrollRestore?: LibraryScrollRestoreState | null
}

export default function GameListView({ games, scrollRestore }: GameListViewProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const libraryNavigation = useLibraryNavigation()

  const virtualizer = useVirtualizer({
    count: games.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => LIST_ROW_HEIGHT,
    overscan: 5,
    useFlushSync: false,
    directDomUpdates: true,
    observeElementRect: observeLibraryScrollRect,
  })

  const scrollToGame = useCallback(
    (index: number) => {
      virtualizer.scrollToIndex(index, { align: 'auto' })
    },
    [virtualizer],
  )

  const setScrollRef = useCallback(
    (node: HTMLDivElement | null) => {
      scrollRef.current = node
      libraryNavigation?.registerScrollContainer(node)
    },
    [libraryNavigation],
  )

  useLibraryScrollRestore(games, scrollRestore, scrollRef, scrollToGame)

  return (
    <div
      ref={setScrollRef}
      data-testid='game-library-list'
      className={`${LIBRARY_SCROLL_HEIGHT_CLASS} overflow-y-auto overscroll-y-contain rounded-2xl border border-slate-200`}
    >
      <ul ref={virtualizer.containerRef} className='relative divide-y divide-slate-100'>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <li
            key={virtualItem.key}
            ref={virtualizer.measureElement}
            data-index={virtualItem.index}
            className='absolute left-0 top-0 w-full'
          >
            <GameListRow game={games[virtualItem.index]} />
          </li>
        ))}
      </ul>
    </div>
  )
}
