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

function GameGridCard({ game }: { game: GroupedGame }) {
  const coverGame = getGroupedGameCoverGame(game)
  const installed = isGroupedGameInstalled(game)

  return (
    <article className='group h-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md'>
      <div className='relative aspect-[460/215] overflow-hidden bg-slate-100'>
        <GameCover
          game={coverGame}
          className='h-full w-full transition duration-300 group-hover:scale-[1.03]'
        />
        {installed && (
          <span className='absolute left-2 top-2 rounded-md bg-emerald-600/90 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white'>
            Installed
          </span>
        )}
      </div>
      <div className='space-y-2 p-3'>
        <p className='line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-5 text-slate-900 group-hover:text-cyan-800'>
          {game.title}
        </p>
        <div className='flex items-start justify-between gap-2'>
          <PlatformBadges platforms={game.platforms} />
          <span className='truncate text-xs text-slate-500'>
            {formatPlaytime(getGroupedGamePlaytime(game))}
          </span>
        </div>
      </div>
    </article>
  )
}

export default memo(GameGridCard)
