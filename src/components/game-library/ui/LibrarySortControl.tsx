import type { LibrarySort } from '../lib/types'

const SORT_OPTIONS: { value: LibrarySort; label: string }[] = [
  { value: 'title', label: 'Title' },
  { value: 'playtime-desc', label: 'Most played' },
  { value: 'playtime-asc', label: 'Least played' },
]

const SORT_STYLES: Record<LibrarySort, { on: string; off: string }> = {
  title: {
    on: 'border-slate-400 bg-slate-200 text-slate-900 ring-1 ring-slate-300',
    off: 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700',
  },
  'playtime-desc': {
    on: 'border-cyan-300 bg-cyan-100 text-cyan-900 ring-1 ring-cyan-200',
    off: 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700',
  },
  'playtime-asc': {
    on: 'border-cyan-300 bg-cyan-100 text-cyan-900 ring-1 ring-cyan-200',
    off: 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700',
  },
}

interface LibrarySortControlProps {
  value: LibrarySort
  onChange: (sort: LibrarySort) => void
}

export default function LibrarySortControl({ value, onChange }: LibrarySortControlProps) {
  return (
    <div
      data-testid='library-sort'
      role='group'
      aria-label='Sort games'
      className='inline-flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1'
    >
      {SORT_OPTIONS.map((option) => {
        const active = value === option.value
        const styles = SORT_STYLES[option.value]

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
