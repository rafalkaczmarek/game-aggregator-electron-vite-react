/** Parses ISO 8601 durations such as PT228H56M33S into whole minutes. */
export function parsePlayDurationToMinutes(duration: string | undefined): number | undefined {
  if (!duration?.startsWith('PT')) return undefined

  const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/)
  if (!match) return undefined

  const hours = Number(match[1] ?? 0)
  const minutes = Number(match[2] ?? 0)
  const seconds = Number(match[3] ?? 0)
  const totalMinutes = hours * 60 + minutes + Math.round(seconds / 60)

  return totalMinutes > 0 ? totalMinutes : undefined
}
