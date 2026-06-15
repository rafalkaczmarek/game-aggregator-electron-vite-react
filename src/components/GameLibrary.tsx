import { useEffect, useState } from 'react'
import type { AggregatedLibrary, GamePlatform } from '@shared/types/game'
import { GAME_PLATFORMS } from '@shared/types/game'
import GameGridView from './game-library/GameGridView'
import GameListView from './game-library/GameListView'
import PlatformFilter from './game-library/PlatformFilter'
import PlayStatusFilter from './game-library/PlayStatusFilter'
import ViewToggle, { type LibraryViewMode } from './game-library/ViewToggle'
import {
  filterGamesByPlatforms,
  filterGroupedGamesByPlayStatus,
  groupGamesByTitle,
  sortGroupedGamesByTitle,
  type PlayStatusFilter as PlayStatusFilterValue,
} from './game-library/format'

export default function GameLibrary() {
  const [library, setLibrary] = useState<AggregatedLibrary | null>(null)
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<LibraryViewMode>('grid')
  const [selectedPlatforms, setSelectedPlatforms] = useState<GamePlatform[]>([])
  const [playStatus, setPlayStatus] = useState<PlayStatusFilterValue>('all')

  useEffect(() => {
    void window.gameApi.getLibrary().then((cached) => {
      if (cached) setLibrary(cached)
    })
  }, [])

  async function handleScan() {
    setLoading(true)
    try {
      const result = await window.gameApi.scanAll()
      setLibrary(result)
    } finally {
      setLoading(false)
    }
  }

  const filteredGames = library ? filterGamesByPlatforms(library.games, selectedPlatforms) : []
  const groupedGames = sortGroupedGamesByTitle(
    filterGroupedGamesByPlayStatus(groupGamesByTitle(filteredGames), playStatus),
  )
  const isFiltered = selectedPlatforms.length > 0 || playStatus !== 'all'

  return (
    <section className='rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.35)]'>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div>
          <div className='text-sm uppercase tracking-[0.3em] text-slate-500'>Game library</div>
          <p className='mt-2 text-sm text-slate-600'>
            Platforms: {GAME_PLATFORMS.join(', ')}. Steam scanner reads local files; add an API key
            in Settings for full library metadata.
          </p>
        </div>
        <button
          type='button'
          onClick={handleScan}
          disabled={loading}
          className='inline-flex items-center justify-center rounded-2xl bg-cyan-500 px-5 py-3 font-semibold text-white transition hover:bg-cyan-600 disabled:opacity-60'
        >
          {loading ? 'Scanning…' : 'Scan libraries'}
        </button>
      </div>

      {library && (
        <div className='mt-6 space-y-4'>
          <p className='text-sm text-slate-500'>
            Last scan: {new Date(library.scannedAt).toLocaleString()} — {groupedGames.length} games
            {isFiltered && <span className='text-slate-400'> (filtered)</span>}
            {!isFiltered && groupedGames.length !== library.games.length && (
              <span className='text-slate-400'> ({library.games.length} across platforms)</span>
            )}
          </p>
          <ul data-testid='platform-summary' className='space-y-2'>
            {library.results.map((result) => (
              <li
                key={result.platform}
                className='rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm'
              >
                <span className='font-medium capitalize'>{result.platform}</span>
                {' — '}
                {result.games.length} games
                {result.errors.length > 0 && (
                  <span className='text-amber-700'> ({result.errors.join('; ')})</span>
                )}
              </li>
            ))}
          </ul>

          {library.games.length > 0 ? (
            <div className='space-y-4'>
              <div className='flex flex-wrap items-center justify-between gap-3'>
                <h3 className='text-base font-semibold text-slate-900'>Your games</h3>
                <div className='flex flex-wrap items-center gap-3'>
                  <PlatformFilter value={selectedPlatforms} onChange={setSelectedPlatforms} />
                  <PlayStatusFilter value={playStatus} onChange={setPlayStatus} />
                  <ViewToggle value={viewMode} onChange={setViewMode} />
                </div>
              </div>
              {groupedGames.length > 0 ? (
                viewMode === 'grid' ? (
                  <GameGridView games={groupedGames} />
                ) : (
                  <GameListView games={groupedGames} />
                )
              ) : (
                <p className='rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500'>
                  No games match the current filters. Adjust or clear your filters.
                </p>
              )}
            </div>
          ) : (
            <p className='rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500'>
              No games found. Run a scan after installing games on Steam, GOG, Epic, or linking PSN.
            </p>
          )}
        </div>
      )}
    </section>
  )
}
