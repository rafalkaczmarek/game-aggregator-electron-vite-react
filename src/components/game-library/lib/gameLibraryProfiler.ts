import type { ProfilerOnRenderCallback } from 'react'

export const GAME_LIBRARY_PROFILER_ID = 'GameLibrary'

const enabled = import.meta.env.DEV

/** Logs React commit timings from `<Profiler>` (dev only). */
export const logGameLibraryRender: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime,
) => {
  if (!enabled) return

  const level = actualDuration > 16 ? 'warn' : 'debug'
  console[level](`[Profiler:${id}]`, {
    phase,
    actualDurationMs: Math.round(actualDuration * 10) / 10,
    baseDurationMs: Math.round(baseDuration * 10) / 10,
    startTimeMs: Math.round(startTime),
    commitTimeMs: Math.round(commitTime),
  })
}

/** Measures synchronous work that runs before JSX (not visible to React Profiler). */
export function measureGameLibrarySyncWork<T>(label: string, work: () => T): T {
  if (!enabled) return work()

  const start = performance.now()
  const result = work()
  const durationMs = performance.now() - start

  if (durationMs >= 1) {
    const level = durationMs > 16 ? 'warn' : 'debug'
    console[level](`[GameLibrary sync:${label}] ${durationMs.toFixed(1)}ms`)
  }

  return result
}
