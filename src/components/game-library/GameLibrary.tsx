import { startTransition, useEffect, useState } from 'react'
import type { AggregatedLibrary, GamePlatform } from '@shared/types/game'
import { GAME_PLATFORMS } from '@shared/types/game'
import RouteLoadingFallback from '@src/components/app-shell/ui/RouteLoadingFallback'
import { filterGamesByPlatforms, filterGroupedGamesByPlayStatus } from './lib/filters'
import { groupGamesByTitle } from './lib/grouping'
import { sortGroupedGames } from './lib/sort'
import type { LibrarySort, PlayStatusFilter as PlayStatusFilterValue } from './lib/types'
import GameGridView from './ui/GameGridView'
import GameListView from './ui/GameListView'
import PlatformFilter from './ui/PlatformFilter'
import LibrarySortControl from './ui/LibrarySortControl'
import PlayStatusFilter from './ui/PlayStatusFilter'
import ViewToggle, { type LibraryViewMode } from './ui/ViewToggle'

export default function GameLibrary() {
  const [library, setLibrary] = useState<AggregatedLibrary | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<LibraryViewMode>('grid')
  const [selectedPlatforms, setSelectedPlatforms] = useState<GamePlatform[]>([])
  const [playStatus, setPlayStatus] = useState<PlayStatusFilterValue>('all')
  const [librarySort, setLibrarySort] = useState<LibrarySort>('title')

  useEffect(() => {
    let cancelled = false

    void window.gameApi.getLibrary().then((cached) => {
      if (cancelled) return

      if (cached) {
        startTransition(() => {
          setLibrary(cached)
          setInitialLoading(false)
        })
        return
      }

      setInitialLoading(false)
    })

    return () => {
      cancelled = true
    }
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
  const groupedGames = sortGroupedGames(
    filterGroupedGamesByPlayStatus(groupGamesByTitle(filteredGames), playStatus),
    librarySort,
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

      {initialLoading ? (
        <div className='mt-6'>
          <RouteLoadingFallback embedded label='Ładowanie biblioteki…' />
        </div>
      ) : (
        library && (
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
                  <LibrarySortControl value={librarySort} onChange={setLibrarySort} />
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
        )
      )}
    </section>
  )
}
