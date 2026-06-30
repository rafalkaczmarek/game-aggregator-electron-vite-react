interface LibrarySearchProps {
  value: string
  onChange: (query: string) => void
}

export default function LibrarySearch({ value, onChange }: LibrarySearchProps) {
  return (
    <div data-testid='library-search' className='w-full min-w-[12rem] sm:max-w-md'>
      <input
        type='search'
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder='Search games…'
        aria-label='Search games'
        className='w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-cyan-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-200'
      />
    </div>
  )
}
