import { memo } from 'react'
import { Link } from 'react-router-dom'
import GameCover from './GameCover'
import MetacriticBadge from './MetacriticBadge'
import { PlatformBadges } from './PlatformBadge'
import { GRID_CARD_META_HEIGHT_PX, GRID_CARD_WIDTH_SCALE } from '../lib/virtualScroll'
import {
  getGroupedGameCoverGame,
  getGroupedGameMetacritic,
  getGroupedGamePlaytime,
  isGroupedGameInstalled,
} from '../lib/grouping'
import { formatPlaytime } from '../lib/playtime'
import { gameDetailPath } from '../lib/paths'
import { useLibraryNavigation } from '../context/LibraryNavigationContext'
import type { GroupedGame } from '../lib/types'

function GameGridCard({ game }: { game: GroupedGame }) {
  const coverGame = getGroupedGameCoverGame(game)
  const installed = isGroupedGameInstalled(game)
  const rating = getGroupedGameMetacritic(game)
  const libraryNavigation = useLibraryNavigation()

  return (
    <Link
      to={gameDetailPath(game)}
      onClick={() => libraryNavigation?.onGameNavigate(game.key)}
      className='block'
      data-testid={`game-link-${game.key}`}
    >
    <article
      className='group mx-auto overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm hover:border-cyan-200 hover:shadow-md'
      style={{ width: `${GRID_CARD_WIDTH_SCALE * 100}%` }}
    >
      <div className='relative aspect-[2/3] overflow-hidden bg-slate-100'>
        <GameCover game={coverGame} fill className='h-full w-full' />
        {installed && (
          <span className='absolute left-2 top-[14px] z-20 rounded-md bg-emerald-600/90 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white'>
            Installed
          </span>
        )}
        {rating && (
          <div className='absolute right-2 top-[14px] z-20'>
            <MetacriticBadge rating={rating} size='default' />
          </div>
        )}
      </div>
      <div
        className='flex flex-col p-2'
        style={{ height: GRID_CARD_META_HEIGHT_PX }}
      >
        <p className='line-clamp-2 h-10 shrink-0 text-sm font-medium leading-5 text-slate-900 group-hover:text-cyan-800'>
          {game.title}
        </p>
        <div className='mt-auto flex items-center gap-1'>
          <PlatformBadges platforms={game.platforms} size='compact' />
          <span className='ml-auto shrink-0 truncate text-xs text-slate-500'>
            {formatPlaytime(getGroupedGamePlaytime(game))}
          </span>
        </div>
      </div>
    </article>
    </Link>
  )
}

export default memo(GameGridCard)
