import type { GameRecommendation } from '@shared/types/recommendations'
import PlatformBadge from '@src/components/game-library/ui/PlatformBadge'

interface RecommendationCardProps {
  recommendation: GameRecommendation
}

export default function RecommendationCard({ recommendation }: RecommendationCardProps) {
  return (
    <article className='rounded-2xl border border-slate-100 bg-slate-50/80 p-4'>
      <div className='flex gap-4'>
        {recommendation.coverUrl ? (
          <img
            src={recommendation.coverUrl}
            alt=''
            className='h-20 w-[4.5rem] shrink-0 rounded-xl bg-slate-100 object-contain shadow-sm'
            loading='lazy'
          />
        ) : (
          <div className='flex h-20 w-[4.5rem] shrink-0 items-center justify-center rounded-xl bg-slate-200 text-xs font-medium text-slate-500'>
            Brak okładki
          </div>
        )}

        <div className='min-w-0 flex-1 space-y-2'>
          <div className='flex flex-wrap items-start justify-between gap-2'>
            <h4 className='text-base font-semibold text-slate-900'>{recommendation.title}</h4>
            {recommendation.platform && <PlatformBadge platform={recommendation.platform} />}
          </div>
          <p className='text-sm leading-6 text-slate-600'>{recommendation.reason}</p>
        </div>
      </div>
    </article>
  )
}
