import type { Game, GamePlatform } from '@shared/types/game'

export const PLATFORM_LABELS: Record<GamePlatform, string> = {
  steam: 'Steam',
  gog: 'GOG',
  epic: 'Epic',
  psn: 'PSN',
}

export function formatPlaytime(minutes?: number): string {
  if (minutes == null || minutes <= 0) return 'Not played'
  if (minutes < 60) return `${minutes} min`
  const hours = minutes / 60
  return hours >= 10 ? `${Math.round(hours)} hrs` : `${hours.toFixed(1)} hrs`
}

export function sortGamesByTitle(games: Game[]): Game[] {
  return [...games].sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }))
}
