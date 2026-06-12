import type { Game } from '@shared/types/game'
import GameCover from './GameCover'
import PlatformBadge from './PlatformBadge'
import { formatPlaytime } from './format'

export default function GameListView({ games }: { games: Game[] }) {
  return (
    <ul data-testid='game-library-list' className='divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200'>
      {games.map((game) => (
        <li
          key={game.id}
          className='group flex items-center gap-4 bg-white px-3 py-2.5 transition hover:bg-slate-50'
        >
          <GameCover
            game={game}
            className='h-[42px] w-[74px] shrink-0 rounded-md shadow-sm ring-1 ring-slate-200/80'
          />
          <div className='min-w-0 flex-1'>
            <p className='truncate text-sm font-medium text-slate-900 group-hover:text-cyan-800'>
              {game.title}
            </p>
            <p className='mt-0.5 text-xs text-slate-500'>{formatPlaytime(game.playtimeMinutes)}</p>
          </div>
          <div className='flex shrink-0 items-center gap-3'>
            {game.installed && (
              <span className='hidden text-xs font-medium text-emerald-700 sm:inline'>Installed</span>
            )}
            <PlatformBadge platform={game.platform} />
          </div>
        </li>
      ))}
    </ul>
  )
}
