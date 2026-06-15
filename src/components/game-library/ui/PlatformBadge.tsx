import type { GamePlatform } from '@shared/types/game'
import { PLATFORM_LABELS } from '../lib/labels'

const PLATFORM_STYLES: Record<GamePlatform, string> = {
  steam: 'border-sky-200 bg-sky-50 text-sky-800',
  gog: 'border-violet-200 bg-violet-50 text-violet-800',
  epic: 'border-slate-300 bg-slate-100 text-slate-800',
  psn: 'border-blue-200 bg-blue-50 text-blue-800',
}

const BADGE_SIZE_CLASS = {
  default: 'px-2 py-0.5 text-[11px] uppercase tracking-wide',
  compact: 'px-1.5 py-0.5 text-[13px] leading-[1.3]',
} as const

interface PlatformBadgeProps {
  platform: GamePlatform
  size?: keyof typeof BADGE_SIZE_CLASS
}

export default function PlatformBadge({ platform, size = 'default' }: PlatformBadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md border font-semibold ${PLATFORM_STYLES[platform]} ${BADGE_SIZE_CLASS[size]}`}
    >
      {PLATFORM_LABELS[platform]}
    </span>
  )
}

interface PlatformBadgesProps {
  platforms: GamePlatform[]
  size?: keyof typeof BADGE_SIZE_CLASS
}

export function PlatformBadges({ platforms, size = 'default' }: PlatformBadgesProps) {
  return (
    <div
      className={
        size === 'compact'
          ? 'flex min-w-0 flex-nowrap items-center gap-1'
          : 'flex flex-wrap justify-end gap-1'
      }
    >
      {platforms.map((platform) => (
        <PlatformBadge key={platform} platform={platform} size={size} />
      ))}
    </div>
  )
}
