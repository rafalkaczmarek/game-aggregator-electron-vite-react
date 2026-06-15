type RouteLoadingFallbackProps = {
  label?: string
  embedded?: boolean
}

export default function RouteLoadingFallback({
  label = 'Ładowanie…',
  embedded = false,
}: RouteLoadingFallbackProps) {
  const Tag = embedded ? 'div' : 'section'

  return (
    <Tag
      data-testid='route-loading'
      className={
        embedded
          ? 'flex min-h-[12rem] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8'
          : 'flex min-h-[16rem] flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-10 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.35)]'
      }
      role='status'
      aria-live='polite'
      aria-busy='true'
    >
      <div
        className='h-10 w-10 animate-spin rounded-full border-[3px] border-cyan-200 border-t-cyan-500'
        aria-hidden='true'
      />
      <p className='mt-4 text-sm font-medium text-slate-600'>{label}</p>
    </Tag>
  )
}
