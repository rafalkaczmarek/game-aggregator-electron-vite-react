import { useState } from 'react'
import type { AggregatedLibrary } from '@shared/types/game'
import { GAME_PLATFORMS } from '@shared/types/game'

export default function GameLibrary() {
  const [library, setLibrary] = useState<AggregatedLibrary | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleScan() {
    setLoading(true)
    try {
      const result = await window.gameApi.scanAll()
      setLibrary(result)
    } finally {
      setLoading(false)
    }
  }

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
            Last scan: {new Date(library.scannedAt).toLocaleString()} — {library.games.length} games
          </p>
          <ul className='space-y-2'>
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
        </div>
      )}
    </section>
  )
}
