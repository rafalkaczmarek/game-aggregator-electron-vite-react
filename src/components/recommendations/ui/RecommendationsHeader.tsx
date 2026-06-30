interface RecommendationsHeaderProps {
  loading: boolean
  githubConfigured: boolean | null
  onGenerate: () => void
}

export default function RecommendationsHeader({
  loading,
  githubConfigured,
  onGenerate,
}: RecommendationsHeaderProps) {
  return (
    <div className='flex flex-wrap items-start justify-between gap-4'>
      <div className='space-y-2'>
        <div className='text-sm uppercase tracking-[0.3em] text-slate-500'>Rekomendacje</div>
        <p className='max-w-2xl text-sm leading-6 text-slate-600'>
          Na podstawie gier, w które już grałeś (tylko one trafiają do AI), model proponuje nowe
          tytuły. Jeśli propozycja jest w Twojej bibliotece — pokażemy ją w katalogu z okładką i
          platformą.
        </p>
      </div>
      <button
        type='button'
        data-testid='generate-recommendations'
        onClick={onGenerate}
        disabled={loading || githubConfigured === false}
        className='inline-flex items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-50 px-5 py-3 font-semibold text-cyan-900 transition hover:bg-cyan-100 disabled:opacity-60'
      >
        {loading ? 'AI analizuje bibliotekę…' : 'Pokaż rekomendacje'}
      </button>
    </div>
  )
}
