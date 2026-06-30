import type { Game, GameDescription } from '@shared/types/game'
import GameCover from './GameCover'
import MetacriticBadge from './MetacriticBadge'
import PlatformBadge from './PlatformBadge'
import { PLATFORM_LABELS } from '../lib/labels'
import {
  getGroupedGameCoverGame,
  getGroupedGameMetacritic,
  getGroupedGamePlaytime,
} from '../lib/grouping'
import { formatPlaytime } from '../lib/playtime'
import type { GroupedGame } from '../lib/types'

interface GameDetailViewProps {
  game: GroupedGame
  description: GameDescription | null
  descriptionLoading: boolean
  onBack: () => void
}

function formatEntryPlaytime(entry: Game): string {
  return formatPlaytime(entry.playtimeMinutes)
}

export default function GameDetailView({
  game,
  description,
  descriptionLoading,
  onBack,
}: GameDetailViewProps) {
  const coverGame = getGroupedGameCoverGame(game)
  const rating = getGroupedGameMetacritic(game)
  const totalPlaytime = formatPlaytime(getGroupedGamePlaytime(game))

  return (
    <section
      data-testid='game-detail-page'
      className='rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.35)]'
    >
      <button
        type='button'
        onClick={onBack}
        className='inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50'
      >
        ← Back to library
      </button>

      <div className='mt-6 flex flex-col gap-8 lg:flex-row'>
        <div className='mx-auto w-full max-w-[220px] shrink-0 lg:mx-0'>
          <GameCover
            game={coverGame}
            fill
            className='aspect-[2/3] w-full rounded-2xl shadow-md ring-1 ring-slate-200/80'
          />
        </div>

        <div className='min-w-0 flex-1 space-y-6'>
          <div className='space-y-3'>
            <div className='text-sm uppercase tracking-[0.3em] text-slate-500'>Game details</div>
            <h1 className='text-3xl font-semibold tracking-tight text-slate-900'>{game.title}</h1>
            <div className='flex flex-wrap items-center gap-3'>
              {rating && <MetacriticBadge rating={rating} />}
              <span className='text-sm text-slate-600'>Total playtime: {totalPlaytime}</span>
            </div>
          </div>

          <div className='space-y-3'>
            <h2 className='text-base font-semibold text-slate-900'>Platforms</h2>
            <ul className='space-y-2'>
              {game.entries.map((entry) => (
                <li
                  key={entry.id}
                  className='flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm'
                >
                  <div className='flex flex-wrap items-center gap-2'>
                    <PlatformBadge platform={entry.platform} />
                    {entry.installed && (
                      <span className='text-xs font-medium text-emerald-700'>Installed</span>
                    )}
                  </div>
                  <span className='text-slate-600'>
                    {formatEntryPlaytime(entry)} on {PLATFORM_LABELS[entry.platform]}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className='space-y-3'>
            <h2 className='text-base font-semibold text-slate-900'>Description</h2>
            {descriptionLoading ? (
              <p className='text-sm text-slate-500' role='status'>
                Loading description…
              </p>
            ) : description ? (
              <p className='text-sm leading-7 text-slate-700'>{description.text}</p>
            ) : (
              <p className='rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500'>
                No description available for this game yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
