import type { Game } from '@shared/types/game'
import GameCover from './GameCover'
import PlatformBadge from './PlatformBadge'
import { formatPlaytime } from './format'

export default function GameGridView({ games }: { games: Game[] }) {
  return (
    <ul data-testid='game-library-grid' className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'>
      {games.map((game) => (
        <li key={game.id}>
          <article className='group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md'>
            <div className='relative aspect-[460/215] overflow-hidden bg-slate-100'>
              <GameCover
                game={game}
                className='h-full w-full transition duration-300 group-hover:scale-[1.03]'
              />
              {game.installed && (
                <span className='absolute left-2 top-2 rounded-md bg-emerald-600/90 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white'>
                  Installed
                </span>
              )}
            </div>
            <div className='space-y-2 p-3'>
              <p className='line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-5 text-slate-900 group-hover:text-cyan-800'>
                {game.title}
              </p>
              <div className='flex items-center justify-between gap-2'>
                <PlatformBadge platform={game.platform} />
                <span className='truncate text-xs text-slate-500'>{formatPlaytime(game.playtimeMinutes)}</span>
              </div>
            </div>
          </article>
        </li>
      ))}
    </ul>
  )
}
