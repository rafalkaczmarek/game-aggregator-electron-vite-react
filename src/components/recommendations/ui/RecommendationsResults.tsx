import type { RecommendationsResult } from '@shared/types/recommendations'
import RecommendationCard from './RecommendationCard'

interface RecommendationsResultsProps {
  result: RecommendationsResult
}

export default function RecommendationsResults({ result }: RecommendationsResultsProps) {
  const hasRecommendations = result.owned.length > 0 || result.discover.length > 0

  return (
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
  )
}
