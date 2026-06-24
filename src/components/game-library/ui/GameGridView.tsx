import { useMemo, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import GameGridCard from './GameGridCard'
import { type GroupedGame } from '../lib/types'
import { observeLibraryScrollRect } from '../lib/observeLibraryScrollRect'
import { useScrollContainerWidth } from '../hooks/useScrollContainerWidth'
import {
  estimateGridRowHeight,
  getGridColumnCount,
  GRID_GAP_PX,
  GRID_ROW_GAP_PX,
  LIBRARY_SCROLL_HEIGHT_CLASS,
} from '../lib/virtualScroll'

const FALLBACK_WIDTH = 1024

export default function GameGridView({ games }: { games: GroupedGame[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const containerWidth = useScrollContainerWidth(scrollRef)
  const layoutWidth = containerWidth || FALLBACK_WIDTH
  const columnCount = getGridColumnCount(layoutWidth)
  const rowHeight = estimateGridRowHeight(layoutWidth, columnCount)
  const rowCount = columnCount > 0 ? Math.ceil(games.length / columnCount) : 0

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 4,
    useFlushSync: false,
    directDomUpdates: true,
    observeElementRect: observeLibraryScrollRect,
  })

  const gridStyle = useMemo(
    () => ({
      gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
      columnGap: GRID_GAP_PX,
    }),
    [columnCount],
  )

  return (
    <div
      ref={scrollRef}
      data-testid='game-library-grid'
      className={`${LIBRARY_SCROLL_HEIGHT_CLASS} overflow-y-auto overscroll-y-contain`}
    >
      <ul ref={rowVirtualizer.containerRef} className='relative'>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const rowStartIndex = virtualRow.index * columnCount
          const rowGames = games.slice(rowStartIndex, rowStartIndex + columnCount)

          return (
            <li
              key={virtualRow.key}
              ref={rowVirtualizer.measureElement}
              data-index={virtualRow.index}
              className='absolute left-0 top-0 w-full'
              style={{ paddingBottom: GRID_ROW_GAP_PX }}
            >
              <div className='grid' style={gridStyle}>
                {rowGames.map((game) => (
                  <GameGridCard key={game.key} game={game} />
                ))}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
