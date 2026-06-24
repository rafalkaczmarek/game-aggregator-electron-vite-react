import {
  enrichmentPercent,
  formatEnrichmentDuration,
  type MetacriticEnrichmentUiState,
} from '../lib/metacriticEnrichment'

interface MetacriticEnrichmentStatusProps {
  state: MetacriticEnrichmentUiState
  onDismiss?: () => void
}

export default function MetacriticEnrichmentStatus({
  state,
  onDismiss,
}: MetacriticEnrichmentStatusProps) {
  if (state.status === 'idle') return null

  if (state.status === 'running') {
    const percent = enrichmentPercent(state)

    return (
      <div
        data-testid='metacritic-enrichment-status'
        className='rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3'
        role='status'
        aria-live='polite'
        aria-busy='true'
      >
        <div className='flex items-start gap-3'>
          <div
            className='mt-0.5 h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-cyan-200 border-t-cyan-600'
            aria-hidden='true'
          />
          <div className='min-w-0 flex-1 space-y-2'>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <p className='text-sm font-medium text-slate-800'>Fetching Metacritic scores…</p>
              <span className='text-xs tabular-nums text-slate-600'>
                {state.done}/{state.total} ({percent}%)
              </span>
            </div>
            <div className='h-1.5 overflow-hidden rounded-full bg-cyan-100'>
              <div
                className='h-full rounded-full bg-cyan-500 transition-[width] duration-300 ease-out'
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className='text-xs text-slate-600'>
              {state.enriched > 0
                ? `${state.enriched} games rated so far`
                : 'This may take a few minutes on the first load'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (state.status === 'failed') {
    return (
      <div
        data-testid='metacritic-enrichment-status'
        className='flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3'
        role='status'
        aria-live='polite'
      >
        <p className='text-sm text-amber-900'>
          Metacritic scores could not be loaded. Your library is still available without ratings.
        </p>
        {onDismiss && (
          <button
            type='button'
            onClick={onDismiss}
            className='shrink-0 text-xs font-medium text-amber-800 underline-offset-2 hover:underline'
          >
            Dismiss
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      data-testid='metacritic-enrichment-status'
      className='flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3'
      role='status'
      aria-live='polite'
    >
      <p className='text-sm text-emerald-900'>
        Metacritic scores updated — {state.enriched} games rated in{' '}
        {formatEnrichmentDuration(state.durationMs)}.
      </p>
      {onDismiss && (
        <button
          type='button'
          onClick={onDismiss}
          className='shrink-0 text-xs font-medium text-emerald-800 underline-offset-2 hover:underline'
        >
          Dismiss
        </button>
      )}
    </div>
  )
}
