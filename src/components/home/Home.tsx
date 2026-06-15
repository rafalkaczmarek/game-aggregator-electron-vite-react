export default function Home() {
  return (
    <section
      data-testid='home-page'
      className='overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_24px_70px_-40px_rgba(14,116,144,0.35)] backdrop-blur md:p-10'
    >
      <div className='space-y-6'>
        <div className='inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.24em] text-cyan-800'>
          Witaj
        </div>
        <div className='space-y-4'>
          <h1 className='max-w-xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl'>
            Wszystkie gry w jednym miejscu.
          </h1>
          <p className='max-w-2xl text-base leading-7 text-slate-600 sm:text-lg'>
            Steam, GOG, Epic i PSN — jedna lista. Skanery działają w main process; szczegóły w{' '}
            <code>docs/ARCHITECTURE.md</code>.
          </p>
        </div>
        <p className='max-w-2xl text-sm leading-6 text-slate-500'>
          Użyj panelu po lewej, aby przejść do biblioteki, rekomendacji AI lub ustawień platform.
        </p>
      </div>
    </section>
  )
}
