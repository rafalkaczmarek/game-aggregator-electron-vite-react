import type { GamePlatform } from '@shared/types/game'
import { PLATFORM_LABELS } from './format'

const PLATFORM_STYLES: Record<GamePlatform, string> = {
  steam: 'border-sky-200 bg-sky-50 text-sky-800',
  gog: 'border-violet-200 bg-violet-50 text-violet-800',
  epic: 'border-slate-300 bg-slate-100 text-slate-800',
  psn: 'border-blue-200 bg-blue-50 text-blue-800',
}

export default function PlatformBadge({ platform }: { platform: GamePlatform }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${PLATFORM_STYLES[platform]}`}
    >
      {PLATFORM_LABELS[platform]}
    </span>
  )
}
