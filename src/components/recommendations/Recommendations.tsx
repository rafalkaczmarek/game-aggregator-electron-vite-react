import { useEffect, useState } from 'react'
import { MAX_USER_MESSAGE_LENGTH } from '@shared/types/recommendations'
import type { RecommendationsResult } from '@shared/types/recommendations'
import RecommendationCard from './ui/RecommendationCard'

export default function Recommendations() {
  const [result, setResult] = useState<RecommendationsResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [githubConfigured, setGithubConfigured] = useState<boolean | null>(null)
  const [userMessage, setUserMessage] = useState('')

  useEffect(() => {
    void window.settingsApi.get().then((settings) => {
      setGithubConfigured(settings.githubPatSet)
    })
  }, [])

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const trimmedMessage = userMessage.trim()
      const recommendations = await window.gameApi.getRecommendations(
        trimmedMessage ? { userMessage: trimmedMessage } : undefined,
      )
      setResult(recommendations)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Nie udało się wygenerować rekomendacji.')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  const hasRecommendations =
    result && (result.owned.length > 0 || result.discover.length > 0)

  return (
    <section
      data-testid='recommendations-section'
      className='rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.35)]'
    >
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='space-y-2'>
          <div className='text-sm uppercase tracking-[0.3em] text-slate-500'>Rekomendacje</div>
          <p className='max-w-2xl text-sm leading-6 text-slate-600'>
            Na podstawie gier, w które już grałeś (tylko one trafiają do AI), model proponuje
            nowe tytuły. Jeśli propozycja jest w Twojej bibliotece — pokażemy ją w katalogu z
            okładką i platformą.
          </p>
        </div>
        <button
          type='button'
          data-testid='generate-recommendations'
          onClick={handleGenerate}
          disabled={loading || githubConfigured === false}
          className='inline-flex items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-50 px-5 py-3 font-semibold text-cyan-900 transition hover:bg-cyan-100 disabled:opacity-60'
        >
          {loading ? 'AI analizuje bibliotekę…' : 'Pokaż rekomendacje'}
        </button>
      </div>

      <div className='mt-5 space-y-2'>
        <label htmlFor='recommendations-user-message' className='block text-sm font-medium text-slate-700'>
          Dodatkowe wskazówki (opcjonalnie)
        </label>
        <textarea
          id='recommendations-user-message'
          data-testid='recommendations-user-message'
          value={userMessage}
          onChange={(event) => setUserMessage(event.target.value.slice(0, MAX_USER_MESSAGE_LENGTH))}
          disabled={loading}
          rows={3}
          placeholder='Np. szukam gier indie, RPG z otwartym światem albo krótkich tytułów na wieczór…'
          className='w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 placeholder:text-slate-400 focus:border-cyan-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-100 disabled:opacity-60'
        />
        <p className='text-xs leading-5 text-slate-500'>
          Krótka wiadomość trafi do promptu AI — możesz podać gatunek, nastrój lub inne preferencje.
        </p>
      </div>

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

      {result && (
        <div className='mt-6 space-y-6'>
          <p className='text-sm text-slate-500'>
            Profil oparty na {result.basedOnPlayedCount}{' '}
            {result.basedOnPlayedCount === 1 ? 'grze' : 'grach'} z czasem gry.
          </p>

          {result.errors.length > 0 && (
            <ul className='space-y-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900'>
              {result.errors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          )}

          {hasRecommendations ? (
            <div className='grid gap-8 lg:grid-cols-2'>
              <div className='space-y-4'>
                <h3 className='text-base font-semibold text-slate-900'>Z Twojego katalogu</h3>
                {result.owned.length > 0 ? (
                  <div className='space-y-3'>
                    {result.owned.map((recommendation) => (
                      <RecommendationCard
                        key={`owned-${recommendation.title}`}
                        recommendation={recommendation}
                      />
                    ))}
                  </div>
                ) : (
                  <p className='rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500'>
                    Brak dopasowanych gier w katalogu — może wszystkie ulubione tytuły masz już
                    rozegrane?
                  </p>
                )}
              </div>

              <div className='space-y-4'>
                <h3 className='text-base font-semibold text-slate-900'>Do odkrycia</h3>
                {result.discover.length > 0 ? (
                  <div className='space-y-3'>
                    {result.discover.map((recommendation) => (
                      <RecommendationCard
                        key={`discover-${recommendation.title}`}
                        recommendation={recommendation}
                      />
                    ))}
                  </div>
                ) : (
                  <p className='rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500'>
                    Nie znaleziono propozycji spoza biblioteki.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className='rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500'>
              Najpierw zeskanuj bibliotekę i zagraj w kilka gier, aby zbudować profil gustu.
            </p>
          )}
        </div>
      )}
    </section>
  )
}
