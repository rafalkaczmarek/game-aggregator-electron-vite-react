import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import GameListRow from './GameListRow'
import { type GroupedGame } from '../lib/types'
import { observeLibraryScrollRect } from '../lib/observeLibraryScrollRect'
import { LIBRARY_SCROLL_HEIGHT_CLASS, LIST_ROW_HEIGHT } from '../lib/virtualScroll'

export default function GameListView({ games }: { games: GroupedGame[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: games.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => LIST_ROW_HEIGHT,
    overscan: 5,
    useFlushSync: false,
    directDomUpdates: true,
    observeElementRect: observeLibraryScrollRect,
  })

  return (
    <div
      ref={scrollRef}
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
