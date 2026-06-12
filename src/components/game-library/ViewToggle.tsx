export type LibraryViewMode = 'list' | 'grid'

interface ViewToggleProps {
  value: LibraryViewMode
  onChange: (mode: LibraryViewMode) => void
}

function ViewButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type='button'
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition ${
        active
          ? 'border-cyan-300 bg-cyan-50 text-cyan-800'
          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
      }`}
    >
      {children}
    </button>
  )
}

export default function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className='inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1'>
      <ViewButton active={value === 'list'} label='List view' onClick={() => onChange('list')}>
        <svg className='h-4 w-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
          <path strokeLinecap='round' d='M4 6h16M4 12h16M4 18h16' />
        </svg>
      </ViewButton>
      <ViewButton active={value === 'grid'} label='Grid view' onClick={() => onChange('grid')}>
        <svg className='h-4 w-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
          <rect x='3' y='3' width='7' height='7' rx='1' />
          <rect x='14' y='3' width='7' height='7' rx='1' />
          <rect x='3' y='14' width='7' height='7' rx='1' />
          <rect x='14' y='14' width='7' height='7' rx='1' />
        </svg>
      </ViewButton>
    </div>
  )
}
