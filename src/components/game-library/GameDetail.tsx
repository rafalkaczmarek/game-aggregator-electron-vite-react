import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { AggregatedLibrary, GameDescription } from '@shared/types/game'
import RouteLoadingFallback from '@src/components/app-shell/ui/RouteLoadingFallback'
import { findGroupedGameByKey } from './lib/grouping'
import GameDetailView from './ui/GameDetailView'

export default function GameDetail() {
  const { gameKey = '' } = useParams<{ gameKey: string }>()
  const navigate = useNavigate()
  const [library, setLibrary] = useState<AggregatedLibrary | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [description, setDescription] = useState<GameDescription | null>(null)
  const [descriptionLoading, setDescriptionLoading] = useState(false)

  const groupedGame = useMemo(
    () => (library ? findGroupedGameByKey(library.games, gameKey) : undefined),
    [library, gameKey],
  )

  useEffect(() => {
    let cancelled = false

    void window.gameApi.getLibrary().then((cached) => {
      if (cancelled) return
      setLibrary(cached)
      setInitialLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!groupedGame) {
      setDescription(null)
      setDescriptionLoading(false)
      return
    }

    const steamEntry = groupedGame.entries.find(
      (entry) => entry.platform === 'steam' && entry.sourceId,
    )

    if (!steamEntry?.sourceId) {
      setDescription(null)
      setDescriptionLoading(false)
      return
    }

    let cancelled = false
    setDescriptionLoading(true)

    void window.gameApi
      .getGameDescription({ platform: 'steam', sourceId: steamEntry.sourceId })
      .then((result) => {
        if (!cancelled) {
          setDescription(result)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setDescriptionLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [groupedGame])

  if (initialLoading) {
    return <RouteLoadingFallback label='Ładowanie gry…' />
  }

  if (!groupedGame) {
    return (
      <section
        data-testid='game-detail-not-found'
        className='rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.35)]'
      >
        <button
          type='button'
          onClick={() => navigate('/library')}
          className='inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50'
        >
          ← Back to library
        </button>
        <p className='mt-6 text-sm text-slate-600'>
          Game not found. It may have been removed from your library since the last scan.
        </p>
      </section>
    )
  }

  return (
    <GameDetailView
      game={groupedGame}
      description={description}
      descriptionLoading={descriptionLoading}
      onBack={() => navigate('/library')}
    />
  )
}
