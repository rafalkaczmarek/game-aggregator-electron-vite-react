import type { GamePlatform } from '@shared/types/game'
import { GAME_PLATFORMS } from '@shared/types/game'
import { PLATFORM_LABELS } from '../lib/labels'

const PLATFORM_STYLES: Record<GamePlatform, { on: string; off: string }> = {
  steam: {
    on: 'border-sky-300 bg-sky-100 text-sky-900 ring-1 ring-sky-200',
    off: 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700',
  },
  gog: {
    on: 'border-violet-300 bg-violet-100 text-violet-900 ring-1 ring-violet-200',
    off: 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700',
  },
  epic: {
    on: 'border-slate-400 bg-slate-200 text-slate-900 ring-1 ring-slate-300',
    off: 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700',
  },
  psn: {
    on: 'border-blue-300 bg-blue-100 text-blue-900 ring-1 ring-blue-200',
    off: 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700',
  },
}

interface PlatformFilterProps {
  value: GamePlatform[]
  onChange: (platforms: GamePlatform[]) => void
}

export default function PlatformFilter({ value, onChange }: PlatformFilterProps) {
  const selected = new Set(value)

  function toggle(platform: GamePlatform) {
    if (selected.has(platform)) {
      onChange(value.filter((entry) => entry !== platform))
      return
    }

    onChange(
      [...value, platform].sort((a, b) => GAME_PLATFORMS.indexOf(a) - GAME_PLATFORMS.indexOf(b)),
    )
  }

  return (
    <div
      data-testid='platform-filter'
      role='group'
      aria-label='Filter by platform'
      className='inline-flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1'
    >
      {GAME_PLATFORMS.map((platform) => {
        const active = selected.has(platform)
        const styles = PLATFORM_STYLES[platform]

        return (
          <button
            key={platform}
            type='button'
            aria-pressed={active}
            onClick={() => toggle(platform)}
            className={`inline-flex items-center rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition ${active ? styles.on : styles.off}`}
          >
            {PLATFORM_LABELS[platform]}
          </button>
        )
      })}
    </div>
  )
}
