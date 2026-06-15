import { memo } from 'react'
import GameCover from './GameCover'
import { PlatformBadges } from './PlatformBadge'
import {
  getGroupedGameCoverGame,
  getGroupedGamePlaytime,
  isGroupedGameInstalled,
} from '../lib/grouping'
import { formatPlaytime } from '../lib/playtime'
import type { GroupedGame } from '../lib/types'

function GameListRow({ game }: { game: GroupedGame }) {
  const coverGame = getGroupedGameCoverGame(game)
  const installed = isGroupedGameInstalled(game)

  return (
    <div className='group flex items-center gap-3 bg-white px-3 py-0 transition hover:bg-slate-50'>
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
        {installed && (
          <span className='hidden text-xs font-medium text-emerald-700 sm:inline'>Installed</span>
        )}
        <PlatformBadges platforms={game.platforms} />
      </div>
    </div>
  )
}

export default memo(GameListRow)
