import type { AggregatedLibrary, Game } from '@shared/types/game'

export const sampleGames: Game[] = [
  {
    id: 'steam-570',
    platform: 'steam',
    title: 'Dota 2',
    installed: true,
    playtimeMinutes: 125,
    coverUrl: 'https://cdn.cloudflare.steamstatic.com/steam/apps/570/header.jpg',
    sourceId: '570',
  },
  {
    id: 'gog-1',
    platform: 'gog',
    title: 'Cyberpunk 2077',
    installed: false,
    playtimeMinutes: 0,
    sourceId: '1',
  },
  {
    id: 'epic-2',
    platform: 'epic',
    title: 'Alan Wake',
    installed: true,
    playtimeMinutes: 45,
    sourceId: '2',
  },
]

export function createMockLibrary(games: Game[] = sampleGames): AggregatedLibrary {
  const byPlatform = (platform: Game['platform']) => games.filter((game) => game.platform === platform)

  return {
    scannedAt: '2026-06-12T12:00:00.000Z',
    games,
    results: [
      { platform: 'steam', games: byPlatform('steam'), errors: [] },
      { platform: 'gog', games: byPlatform('gog'), errors: [] },
      { platform: 'epic', games: byPlatform('epic'), errors: [] },
      { platform: 'psn', games: byPlatform('psn'), errors: [] },
    ],
  }
}
