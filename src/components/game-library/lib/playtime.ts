import type { Game } from '@shared/types/game'

export function formatPlaytime(minutes?: number): string {
  if (minutes == null || minutes <= 0) return 'Not played'
  if (minutes < 60) return `${minutes} min`
  const hours = minutes / 60
  return hours >= 10 ? `${Math.round(hours)} hrs` : `${hours.toFixed(1)} hrs`
}

export function isGamePlayed(game: Game): boolean {
  return (game.playtimeMinutes ?? 0) > 0
}
