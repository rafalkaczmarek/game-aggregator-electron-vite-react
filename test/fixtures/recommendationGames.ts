import type { Game } from '@shared/types/game'

export const recommendationGames: Game[] = [
  {
    id: 'steam-570',
    platform: 'steam',
    title: 'Dota 2',
    installed: true,
    playtimeMinutes: 6000,
    sourceId: '570',
  },
  {
    id: 'gog-cp',
    platform: 'gog',
    title: 'Cyberpunk 2077',
    installed: false,
    playtimeMinutes: 0,
  },
  {
    id: 'epic-alan',
    platform: 'epic',
    title: 'Alan Wake',
    installed: true,
    playtimeMinutes: 120,
    sourceId: '2',
  },
]

export function createLargeRecommendationLibrary(gameCount: number): Game[] {
  const games: Game[] = []
  for (let index = 0; index < gameCount; index++) {
    games.push({
      id: `steam-${index}`,
      platform: 'steam',
      title: `Very Long Game Title Number ${index} With Extra Words`,
      installed: index % 2 === 0,
      playtimeMinutes: index % 3 === 0 ? index * 30 : 0,
      sourceId: String(index),
    })
  }
  return games
}
