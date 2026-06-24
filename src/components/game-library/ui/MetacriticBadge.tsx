import type { MetacriticRating } from '@shared/types/game'
import {
  formatMetascore,
  formatUserScore,
  getMetascoreTier,
  getUserScoreTier,
  hasAnyScore,
  type MetacriticScoreTier,
} from '../lib/metacritic'

const TIER_STYLES: Record<MetacriticScoreTier, string> = {
  positive: 'bg-emerald-600 text-white',
  mixed: 'bg-amber-400 text-slate-900',
  negative: 'bg-rose-600 text-white',
  unknown: 'bg-slate-300 text-slate-700',
}

const SIZE_CLASS = {
  default:
    'h-6 min-w-[24px] px-1.5 text-[11px] font-bold leading-none',
  compact:
    'h-[18px] min-w-[20px] px-1 text-[10px] font-bold leading-none',
} as const

type Size = keyof typeof SIZE_CLASS

interface MetacriticBadgeProps {
  rating: MetacriticRating
  size?: Size
}

/**
 * Compact Metacritic chip that shows Metascore (0-100) and/or User Score (0-10).
 * Renders nothing when both scores are missing.
 */
export default function MetacriticBadge({ rating, size = 'default' }: MetacriticBadgeProps) {
  if (!hasAnyScore(rating)) return null

  const metascoreTier = getMetascoreTier(rating.metascore)
  const userScoreTier = getUserScoreTier(rating.userScore)
  const sizeClass = SIZE_CLASS[size]

  return (
    <div
      className='flex shrink-0 items-center gap-0.5'
      title={`Metacritic${rating.platform ? ` (${rating.platform})` : ''}`}
      data-testid='metacritic-badge'
    >
      {typeof rating.metascore === 'number' && (
        <span
          className={`inline-flex items-center justify-center rounded-sm ${TIER_STYLES[metascoreTier]} ${sizeClass}`}
          aria-label={`Metascore: ${formatMetascore(rating.metascore)}`}
        >
          {formatMetascore(rating.metascore)}
        </span>
      )}
      {typeof rating.userScore === 'number' && (
        <span
          className={`inline-flex items-center justify-center rounded-sm ${TIER_STYLES[userScoreTier]} ${sizeClass}`}
          aria-label={`User score: ${formatUserScore(rating.userScore)}`}
        >
          {formatUserScore(rating.userScore)}
        </span>
      )}
    </div>
  )
}
