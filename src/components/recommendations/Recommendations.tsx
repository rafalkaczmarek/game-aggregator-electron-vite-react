import { useRecommendations } from './hooks/useRecommendations'
import RecommendationsHeader from './ui/RecommendationsHeader'
import RecommendationsResults from './ui/RecommendationsResults'
import RecommendationsUserMessage from './ui/RecommendationsUserMessage'

export default function Recommendations() {
  const {
    result,
    loading,
    error,
    githubConfigured,
    userMessage,
    setUserMessage,
    handleGenerate,
  } = useRecommendations()

  return (
    <section
      data-testid='recommendations-section'
      className='rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.35)]'
    >
      <RecommendationsHeader
        loading={loading}
        githubConfigured={githubConfigured}
        onGenerate={handleGenerate}
      />

      <RecommendationsUserMessage
        value={userMessage}
        disabled={loading}
        onChange={setUserMessage}
      />

      {githubConfigured === false && (
        <p className='mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900'>
          Dodaj token GitHub PAT (zakres models) w Ustawieniach, aby włączyć darmowe rekomendacje
          przez GitHub Models.
        </p>
      )}

      {error && (
        <p className='mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800'>
          {error}
        </p>
      )}

      {result && <RecommendationsResults result={result} />}
    </section>
  )
}
