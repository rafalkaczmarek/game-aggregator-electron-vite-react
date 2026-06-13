import GameLibrary from '@src/components/GameLibrary'
import Settings from '@src/components/Settings'

function App() {
  return (
    <div className='relative min-h-screen overflow-hidden bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8'>
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute -left-28 top-10 h-96 w-96 rounded-full bg-cyan-200/50 blur-3xl' />
        <div className='absolute -right-24 top-28 h-96 w-96 rounded-full bg-sky-200/40 blur-3xl' />
        <div className='absolute bottom-0 left-1/2 h-72 w-[46rem] -translate-x-1/2 bg-gradient-to-r from-cyan-200/0 via-cyan-300/45 to-cyan-200/0 blur-3xl' />
      </div>

      <div className='relative mx-auto flex w-full max-w-6xl flex-col gap-8'>
        <section className='overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 shadow-[0_24px_70px_-40px_rgba(14,116,144,0.35)] backdrop-blur'>
          <div className='p-6 md:p-10'>
            <div className='flex flex-col justify-between gap-8'>
              <div className='space-y-6'>
                <div className='inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.24em] text-cyan-800'>
                  Game Aggregator
                </div>
                <div className='space-y-4'>
                  <h1 className='max-w-xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl'>
                    Wszystkie gry w jednym miejscu.
                  </h1>
                  <p className='max-w-2xl text-base leading-7 text-slate-600 sm:text-lg'>
                    Steam, GOG, Epic i PSN — jedna lista. Skanery działają w main process; szczegóły
                    w <code>docs/ARCHITECTURE.md</code>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Settings />

        <GameLibrary />
      </div>
    </div>
  )
}

export default App
