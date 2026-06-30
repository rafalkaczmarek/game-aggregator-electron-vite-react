import type { AggregatedLibrary, Game, MetacriticRating } from '@shared/types/game'
import { METACRITIC_PLATFORM_CANDIDATES } from '@electron/metadata/metacritic/platforms'
import type { MetacriticCacheFile } from '@electron/metadata/metacritic/cache'
import { cacheKey } from '@electron/metadata/metacritic/slug'

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
  const byPlatform = (platform: Game['platform']) =>
    games.filter((game) => game.platform === platform)

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

/** Same game on GOG + Epic with slightly different titles (colon / apostrophe). */
export const duplicateTitleGames: Game[] = [
  {
    id: 'gog-plague',
    platform: 'gog',
    title: 'A Plague Tale Innocence',
    installed: false,
    playtimeMinutes: 120,
  },
  {
    id: 'epic-plague',
    platform: 'epic',
    title: 'A Plague Tale: Innocence',
    installed: true,
    playtimeMinutes: 30,
    coverUrl: 'https://example.com/plague.jpg',
  },
  {
    id: 'steam-dota',
    platform: 'steam',
    title: 'Dota 2',
    installed: true,
    playtimeMinutes: 125,
    sourceId: '570',
  },
]

export function createDuplicateTitleLibrary(): AggregatedLibrary {
  return createMockLibrary(duplicateTitleGames)
}

const sampleMetacriticRatings: Record<string, MetacriticRating> = {
  'steam-570': { metascore: 90, userScore: 6.8, platform: 'pc' },
  'gog-1': { metascore: 86, userScore: 7.2, platform: 'pc' },
  'epic-2': { metascore: 83, userScore: 8.9, platform: 'pc' },
}

export function withMetacriticRatings(library: AggregatedLibrary): AggregatedLibrary {
  const games = library.games.map((game) => ({
    ...game,
    metacritic: sampleMetacriticRatings[game.id] ?? game.metacritic,
  }))

  return {
    ...library,
    games,
    results: library.results.map((result) => ({
      ...result,
      games: games.filter((game) => game.platform === result.platform),
    })),
  }
}

export function createMockLibraryWithMetacritic(
  games: Game[] = sampleGames,
): AggregatedLibrary {
  return withMetacriticRatings(createMockLibrary(games))
}

/** Duplicate title across GOG + Epic with different Metacritic scores (grouping picks best metascore). */
export function createMetacriticDuplicateTitleLibrary(): AggregatedLibrary {
  return createMockLibrary([
    {
      id: 'gog-plague',
      platform: 'gog',
      title: 'A Plague Tale Innocence',
      installed: false,
      playtimeMinutes: 120,
      metacritic: { metascore: 78, userScore: 7.5, platform: 'pc' },
    },
    {
      id: 'epic-plague',
      platform: 'epic',
      title: 'A Plague Tale: Innocence',
      installed: true,
      playtimeMinutes: 30,
      coverUrl: 'https://example.com/plague.jpg',
      metacritic: { metascore: 92, userScore: 8.1, platform: 'pc' },
    },
  ])
}

export function createLargeMockLibrary(count: number): AggregatedLibrary {
  const games: Game[] = Array.from({ length: count }, (_, index) => ({
    id: `steam-${index}`,
    platform: 'steam',
    title: `Game ${String(index).padStart(4, '0')}`,
    installed: index % 3 === 0,
    playtimeMinutes: index * 10,
    sourceId: String(index),
  }))

  return createMockLibrary(games)
}

/** Builds a metacritic-cache.json payload for the given library (E2E / unit tests). */
export function createMetacriticCachePayload(
  library: AggregatedLibrary,
  ratingsByGameId: Record<string, MetacriticRating> = sampleMetacriticRatings,
): MetacriticCacheFile {
  const fetchedAt = '2026-06-24T12:00:00.000Z'
  const entries: MetacriticCacheFile['entries'] = {}

  for (const game of library.games) {
    const rating = ratingsByGameId[game.id] ?? game.metacritic
    if (!rating) continue

    const candidates = METACRITIC_PLATFORM_CANDIDATES[game.platform]
    const candidate = rating.platform ?? candidates[0]
    entries[cacheKey(game.title, candidate)] = {
      rating: { ...rating, fetchedAt },
      fetchedAt,
    }
  }

  return { version: 1, entries }
}
