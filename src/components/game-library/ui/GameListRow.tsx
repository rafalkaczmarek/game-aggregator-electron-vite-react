import { memo } from 'react'
import { Link } from 'react-router-dom'
import GameCover from './GameCover'
import MetacriticBadge from './MetacriticBadge'
import { PlatformBadges } from './PlatformBadge'
import {
  getGroupedGameCoverGame,
  getGroupedGameMetacritic,
  getGroupedGamePlaytime,
  isGroupedGameInstalled,
} from '../lib/grouping'
import { formatPlaytime } from '../lib/playtime'
import { gameDetailPath } from '../lib/paths'
import type { GroupedGame } from '../lib/types'

function GameListRow({ game }: { game: GroupedGame }) {
  const coverGame = getGroupedGameCoverGame(game)
  const installed = isGroupedGameInstalled(game)
  const rating = getGroupedGameMetacritic(game)

  return (
    <Link
      to={gameDetailPath(game)}
      className='group flex items-center gap-3 bg-white px-3 py-0 transition hover:bg-slate-50'
      data-testid={`game-link-${game.key}`}
    >
      <GameCover
        game={coverGame}
        fill
        className='h-[44px] w-[29px] shrink-0 rounded-md shadow-sm ring-1 ring-slate-200/80'
      />
      <div className='min-w-0 flex-1'>
        <p className='truncate text-sm font-medium text-slate-900 group-hover:text-cyan-800'>
          {game.title}
        </p>
        <p className='mt-0.5 text-xs text-slate-500'>
          {formatPlaytime(getGroupedGamePlaytime(game))}
        </p>
      </div>
      <div className='flex shrink-0 items-center gap-3'>
        {rating && <MetacriticBadge rating={rating} size='default' />}
        {installed && (
          <span className='hidden text-xs font-medium text-emerald-700 sm:inline'>Installed</span>
        )}
        <PlatformBadges platforms={game.platforms} />
      </div>
    </Link>
  )
}

export default memo(GameListRow)
