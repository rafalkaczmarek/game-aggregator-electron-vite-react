import type { PlayStatusFilter as PlayStatusFilterValue } from './format'

const PLAY_STATUS_OPTIONS: { value: PlayStatusFilterValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'played', label: 'Played' },
  { value: 'unplayed', label: 'Not played' },
]

const PLAY_STATUS_STYLES: Record<PlayStatusFilterValue, { on: string; off: string }> = {
  all: {
    on: 'border-slate-400 bg-slate-200 text-slate-900 ring-1 ring-slate-300',
    off: 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700',
  },
  played: {
    on: 'border-emerald-300 bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200',
    off: 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700',
  },
  unplayed: {
    on: 'border-amber-300 bg-amber-100 text-amber-900 ring-1 ring-amber-200',
    off: 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700',
  },
}

interface PlayStatusFilterProps {
  value: PlayStatusFilterValue
  onChange: (status: PlayStatusFilterValue) => void
}

export default function PlayStatusFilter({ value, onChange }: PlayStatusFilterProps) {
  return (
    <div
      data-testid='play-status-filter'
      role='group'
      aria-label='Filter by play status'
      className='inline-flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1'
    >
      {PLAY_STATUS_OPTIONS.map((option) => {
        const active = value === option.value
        const styles = PLAY_STATUS_STYLES[option.value]

        return (
          <button
            key={option.value}
            type='button'
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`inline-flex items-center rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition ${active ? styles.on : styles.off}`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
