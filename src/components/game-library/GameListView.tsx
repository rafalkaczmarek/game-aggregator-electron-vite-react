import { useMemo, useRef } from 'react'
import GameListRow from './GameListRow'
import { type GroupedGame } from './format'
import { useScrollContainerMetrics } from './useScrollContainerMetrics'
import { getVisibleGridRange, LIBRARY_SCROLL_HEIGHT_CLASS, LIST_ROW_HEIGHT } from './virtualScroll'

export default function GameListView({ games }: { games: GroupedGame[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { height, scrollTop } = useScrollContainerMetrics(scrollRef)

  const { startIndex, endIndex, totalHeight } = useMemo(
    () => getVisibleGridRange(scrollTop, height, games.length, 1, LIST_ROW_HEIGHT),
    [scrollTop, height, games.length],
  )

  const visibleGames = games.slice(startIndex, endIndex)

  return (
    <div
      ref={scrollRef}
      data-testid='game-library-list'
      className={`${LIBRARY_SCROLL_HEIGHT_CLASS} overflow-y-auto rounded-2xl border border-slate-200`}
    >
      <ul className='relative divide-y divide-slate-100' style={{ height: `${totalHeight}px` }}>
        {visibleGames.map((game, offset) => {
          const index = startIndex + offset

          return (
            <li
              key={game.key}
              className='absolute left-0 top-0 w-full'
              style={{ transform: `translateY(${index * LIST_ROW_HEIGHT}px)` }}
            >
              <GameListRow game={game} />
            </li>
          )
        })}
      </ul>
    </div>
  )
}
