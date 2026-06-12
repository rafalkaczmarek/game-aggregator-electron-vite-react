import GameCover from './GameCover'
import { PlatformBadges } from './PlatformBadge'
import {
  formatPlaytime,
  getGroupedGameCoverGame,
  getGroupedGamePlaytime,
  isGroupedGameInstalled,
  type GroupedGame,
} from './format'

export default function GameListView({ games }: { games: GroupedGame[] }) {
  return (
    <ul data-testid='game-library-list' className='divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200'>
      {games.map((game) => {
        const coverGame = getGroupedGameCoverGame(game)
        const installed = isGroupedGameInstalled(game)

        return (
          <li
            key={game.key}
            className='group flex items-center gap-4 bg-white px-3 py-2.5 transition hover:bg-slate-50'
          >
            <GameCover
              game={coverGame}
              className='h-[42px] w-[74px] shrink-0 rounded-md shadow-sm ring-1 ring-slate-200/80'
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
          </li>
        )
      })}
    </ul>
  )
}
