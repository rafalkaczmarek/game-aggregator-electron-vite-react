import { useMemo, useRef } from 'react'
import GameGridCard from './GameGridCard'
import { type GroupedGame } from '../lib/types'
import { useScrollContainerMetrics } from '../hooks/useScrollContainerMetrics'
import {
  estimateGridRowHeight,
  getGridColumnCount,
  getVisibleGridRange,
  LIBRARY_SCROLL_HEIGHT_CLASS,
} from '../lib/virtualScroll'

const GRID_GAP_PX = 12

export default function GameGridView({ games }: { games: GroupedGame[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { width, height, scrollTop } = useScrollContainerMetrics(scrollRef)

  const columnCount = getGridColumnCount(width || 1024)
  const rowHeight = estimateGridRowHeight(width || 1024, columnCount)
  const cardWidthExpr = `(100% - ${(columnCount - 1) * GRID_GAP_PX}px) / ${columnCount}`

  const { startIndex, endIndex, totalHeight } = useMemo(
    () => getVisibleGridRange(scrollTop, height, games.length, columnCount, rowHeight),
    [scrollTop, height, games.length, columnCount, rowHeight],
  )

  const visibleGames = games.slice(startIndex, endIndex)

  return (
    <div
      ref={scrollRef}
      data-testid='game-library-grid'
      className={`${LIBRARY_SCROLL_HEIGHT_CLASS} overflow-y-auto`}
    >
      <ul className='relative' style={{ height: `${totalHeight}px` }}>
        {visibleGames.map((game, offset) => {
          const index = startIndex + offset
          const row = Math.floor(index / columnCount)
          const column = index % columnCount

          return (
            <li
              key={game.key}
              className='absolute top-0'
              style={{
                top: row * rowHeight,
                left: `calc(${column} * ((${cardWidthExpr}) + ${GRID_GAP_PX}px))`,
                width: `calc(${cardWidthExpr})`,
              }}
            >
              <GameGridCard game={game} />
            </li>
          )
        })}
      </ul>
    </div>
  )
}
