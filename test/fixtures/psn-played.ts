import type { UserPlayedGamesResponse } from 'psn-api'

type PlayedGameTitle = UserPlayedGamesResponse['titles'][number]

export function createPlayedGame(
  overrides: Pick<PlayedGameTitle, 'titleId' | 'name'> &
    Partial<Pick<PlayedGameTitle, 'playDuration' | 'playCount' | 'concept'>>,
): PlayedGameTitle {
  return {
    titleId: overrides.titleId,
    name: overrides.name,
    localizedName: overrides.name,
    imageUrl: 'https://example.com/icon.png',
    localizedImageUrl: 'https://example.com/icon.png',
    category: 'ps5_native_game',
    service: 'none_purchased',
    playCount: overrides.playCount ?? 1,
    concept: overrides.concept ?? {
      id: 1,
      titleIds: [overrides.titleId],
      name: overrides.name,
      media: { audios: [], videos: [], images: [] },
    },
    media: {},
    firstPlayedDateTime: '2024-01-01T00:00:00Z',
    lastPlayedDateTime: '2024-06-01T00:00:00Z',
    playDuration: overrides.playDuration ?? 'PT1H',
  }
}
