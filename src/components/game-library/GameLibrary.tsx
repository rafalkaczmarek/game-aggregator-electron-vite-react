import { Profiler, startTransition, useEffect, useMemo, useState } from 'react'
import type {
  AggregatedLibrary,
  GamePlatform,
  MetacriticEnrichmentFinished,
  MetacriticEnrichmentProgress,
  MetacriticRatingUpdate,
} from '@shared/types/game'
import { GAME_PLATFORMS } from '@shared/types/game'
import RouteLoadingFallback from '@src/components/app-shell/ui/RouteLoadingFallback'
import {
  filterGamesByPlatforms,
  filterGroupedGamesByPlayStatus,
  filterGroupedGamesBySearchQuery,
} from './lib/filters'
import { groupGamesByTitle } from './lib/grouping'
import {
  applyMetacriticRatingUpdates,
  type MetacriticEnrichmentUiState,
} from './lib/metacriticEnrichment'
import { sortGroupedGames } from './lib/sort'
import type { LibrarySort, PlayStatusFilter as PlayStatusFilterValue } from './lib/types'
import GameGridView from './ui/GameGridView'
import GameListView from './ui/GameListView'
import MetacriticEnrichmentStatus from './ui/MetacriticEnrichmentStatus'
import PlatformFilter from './ui/PlatformFilter'
import LibrarySearch from './ui/LibrarySearch'
import LibrarySortControl from './ui/LibrarySortControl'
import PlayStatusFilter from './ui/PlayStatusFilter'
import ViewToggle, { type LibraryViewMode } from './ui/ViewToggle'
import {
  GAME_LIBRARY_PROFILER_ID,
  logGameLibraryRender,
  measureGameLibrarySyncWork,
} from './lib/gameLibraryProfiler'

const FINISHED_STATUS_DISMISS_MS = 8000

export default function GameLibrary() {
  const [library, setLibrary] = useState<AggregatedLibrary | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<LibraryViewMode>('grid')
  const [selectedPlatforms, setSelectedPlatforms] = useState<GamePlatform[]>([])
  const [playStatus, setPlayStatus] = useState<PlayStatusFilterValue>('all')
  const [librarySort, setLibrarySort] = useState<LibrarySort>('title')
  const [searchQuery, setSearchQuery] = useState('')
  const [metacriticEnrichment, setMetacriticEnrichment] = useState<MetacriticEnrichmentUiState>({
    status: 'idle',
  })

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

  useEffect(() => {
    function onLibraryUpdated(_event: unknown, updated: AggregatedLibrary) {
      startTransition(() => {
        setLibrary(updated)
      })
    }

    function onEnrichmentStarted(_event: unknown, payload: { total: number }) {
      setMetacriticEnrichment({
        status: 'running',
        done: 0,
        total: payload.total,
        enriched: 0,
      })
    }

    function onEnrichmentProgress(_event: unknown, progress: MetacriticEnrichmentProgress) {
      setMetacriticEnrichment({
        status: 'running',
        ...progress,
      })
    }

    function onEnrichmentFinished(_event: unknown, summary: MetacriticEnrichmentFinished) {
      setMetacriticEnrichment({
        status: 'finished',
        ...summary,
      })
    }

    function onRatingsUpdated(_event: unknown, payload: { updates: MetacriticRatingUpdate[] }) {
      startTransition(() => {
        setLibrary((current) =>
          current ? applyMetacriticRatingUpdates(current, payload.updates) : current,
        )
      })
    }

    function onEnrichmentFailed() {
      setMetacriticEnrichment({ status: 'failed' })
    }

    if (!window.ipcRenderer?.on || !window.ipcRenderer?.off) return

    window.ipcRenderer.on('games:library-updated', onLibraryUpdated)
    window.ipcRenderer.on('games:metacritic-ratings-updated', onRatingsUpdated)
    window.ipcRenderer.on('games:metacritic-enrichment-started', onEnrichmentStarted)
    window.ipcRenderer.on('games:metacritic-enrichment-progress', onEnrichmentProgress)
    window.ipcRenderer.on('games:metacritic-enrichment-finished', onEnrichmentFinished)
    window.ipcRenderer.on('games:metacritic-enrichment-failed', onEnrichmentFailed)
    return () => {
      window.ipcRenderer.off('games:library-updated', onLibraryUpdated)
      window.ipcRenderer.off('games:metacritic-ratings-updated', onRatingsUpdated)
      window.ipcRenderer.off('games:metacritic-enrichment-started', onEnrichmentStarted)
      window.ipcRenderer.off('games:metacritic-enrichment-progress', onEnrichmentProgress)
      window.ipcRenderer.off('games:metacritic-enrichment-finished', onEnrichmentFinished)
      window.ipcRenderer.off('games:metacritic-enrichment-failed', onEnrichmentFailed)
    }
  }, [])

  useEffect(() => {
    if (metacriticEnrichment.status !== 'finished') return

    const timer = window.setTimeout(() => {
      setMetacriticEnrichment({ status: 'idle' })
    }, FINISHED_STATUS_DISMISS_MS)

    return () => {
      window.clearTimeout(timer)
    }
  }, [metacriticEnrichment])

  async function handleScan() {
    setLoading(true)
    try {
      const result = await window.gameApi.scanAll()
      startTransition(() => {
        setLibrary(result)
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleEnrichMetacritic() {
    try {
      await window.gameApi.enrichMetacritic()
    } catch {
      setMetacriticEnrichment({ status: 'failed' })
    }
  }

  const metacriticBusy = metacriticEnrichment.status === 'running'
  const canEnrichMetacritic = Boolean(library && library.games.length > 0)

  const groupedGames = useMemo(
    () =>
      measureGameLibrarySyncWork('derive', () => {
        const filteredGames = library
          ? filterGamesByPlatforms(library.games, selectedPlatforms)
          : []
        return sortGroupedGames(
          filterGroupedGamesBySearchQuery(
            filterGroupedGamesByPlayStatus(groupGamesByTitle(filteredGames), playStatus),
            searchQuery,
          ),
          librarySort,
        )
      }),
    [library, selectedPlatforms, playStatus, searchQuery, librarySort],
  )

  const isFiltered =
    selectedPlatforms.length > 0 || playStatus !== 'all' || searchQuery.trim().length > 0

  return (
    <Profiler id={GAME_LIBRARY_PROFILER_ID} onRender={logGameLibraryRender}>
    <section className='rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.35)]'>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div>
          <div className='text-sm uppercase tracking-[0.3em] text-slate-500'>Game library</div>
          <p className='mt-2 text-sm text-slate-600'>
            Platforms: {GAME_PLATFORMS.join(', ')}. Steam scanner reads local files; add an API key
            in Settings for full library metadata.
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-3'>
          <button
            type='button'
            onClick={handleEnrichMetacritic}
            disabled={!canEnrichMetacritic || loading || metacriticBusy}
            className='inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-60'
          >
            {metacriticBusy ? 'Loading Metacritic…' : 'Load Metacritic scores'}
          </button>
          <button
            type='button'
            onClick={handleScan}
            disabled={loading || metacriticBusy}
            className='inline-flex items-center justify-center rounded-2xl bg-cyan-500 px-5 py-3 font-semibold text-white transition hover:bg-cyan-600 disabled:opacity-60'
          >
            {loading ? 'Scanning…' : 'Scan libraries'}
          </button>
        </div>
      </div>

      {initialLoading ? (
        <div className='mt-6'>
          <RouteLoadingFallback embedded label='Ładowanie biblioteki…' />
        </div>
      ) : (
        library && (
        <div className='mt-6 space-y-4'>
          <MetacriticEnrichmentStatus
            state={metacriticEnrichment}
            onDismiss={() => setMetacriticEnrichment({ status: 'idle' })}
          />
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
                  <LibrarySearch value={searchQuery} onChange={setSearchQuery} />
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
    </Profiler>
  )
}
