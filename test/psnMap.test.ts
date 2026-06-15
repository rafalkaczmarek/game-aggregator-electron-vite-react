import { describe, expect, it } from 'vitest'
import type { PurchasedGame, TrophyTitle } from 'psn-api'
import { parsePlayDurationToMinutes } from '../electron/scanners/psn/duration'
import {
  buildPlayedGamesIndex,
  purchasedGameToGame,
  trophyTitleToGame,
} from '../electron/scanners/psn/map'
import { createPlayedGame } from './fixtures/psnPlayed'

describe('psn duration', () => {
  it('parses ISO 8601 play durations into minutes', () => {
    expect(parsePlayDurationToMinutes('PT228H56M33S')).toBe(13737)
    expect(parsePlayDurationToMinutes('PT30M')).toBe(30)
    expect(parsePlayDurationToMinutes('PT45S')).toBe(1)
    expect(parsePlayDurationToMinutes('PT0S')).toBeUndefined()
  })
})

describe('psn map', () => {
  it('maps a purchased game to a game entry', () => {
    const game: PurchasedGame = {
      __typename: 'GameLibraryTitle',
      conceptId: '10001234',
      entitlementId: 'ENT123',
      image: {
        __typename: 'Media',
        url: 'https://example.com/spiderman.png',
      },
      isActive: true,
      isDownloadable: true,
      isPreOrder: false,
      membership: 'NONE',
      name: "Marvel's Spider-Man",
      platform: 'PS5',
      productId: 'PROD123',
      titleId: 'PPSA01467_00',
    }

    expect(purchasedGameToGame(game)).toEqual({
      id: 'psn-PPSA01467_00',
      platform: 'psn',
      title: "Marvel's Spider-Man",
      coverUrl: 'https://example.com/spiderman.png',
      installed: false,
      sourceId: 'PPSA01467_00',
    })
  })

  it('adds playtime when a purchased game appears in played history', () => {
    const purchased: PurchasedGame = {
      __typename: 'GameLibraryTitle',
      conceptId: '10001234',
      entitlementId: 'ENT123',
      image: { __typename: 'Media', url: 'https://example.com/spiderman.png' },
      isActive: true,
      isDownloadable: true,
      isPreOrder: false,
      membership: 'NONE',
      name: "Marvel's Spider-Man",
      platform: 'PS5',
      productId: 'PROD123',
      titleId: 'PPSA01467_00',
    }

    const playedIndex = buildPlayedGamesIndex([
      createPlayedGame({
        titleId: 'PPSA01467_00',
        name: "Marvel's Spider-Man",
        playDuration: 'PT2H15M',
      }),
    ])

    expect(purchasedGameToGame(purchased, playedIndex)).toMatchObject({
      playtimeMinutes: 135,
    })
  })

  it('matches played history via concept title ids', () => {
    const purchased: PurchasedGame = {
      __typename: 'GameLibraryTitle',
      conceptId: '10001234',
      entitlementId: 'ENT123',
      image: { __typename: 'Media', url: 'https://example.com/spiderman.png' },
      isActive: true,
      isDownloadable: true,
      isPreOrder: false,
      membership: 'NONE',
      name: "Marvel's Spider-Man",
      platform: 'PS5',
      productId: 'PROD123',
      titleId: 'PPSA01467_00',
    }

    const playedIndex = buildPlayedGamesIndex([
      createPlayedGame({
        titleId: 'PPSA99999_00',
        name: "Marvel's Spider-Man",
        playDuration: 'PT30M',
        concept: {
          id: 10001234,
          titleIds: ['PPSA99999_00', 'PPSA01467_00'],
          name: "Marvel's Spider-Man",
          media: { audios: [], videos: [], images: [] },
        },
      }),
    ])

    expect(purchasedGameToGame(purchased, playedIndex)).toMatchObject({
      playtimeMinutes: 30,
    })
  })

  it('maps a trophy title to a game entry', () => {
    const title: TrophyTitle = {
      npServiceName: 'trophy2',
      npCommunicationId: 'NPWR20188_00',
      trophySetVersion: '01.00',
      trophyTitleName: "Astro's Playroom",
      trophyTitleIconUrl: 'https://example.com/astro.png',
      trophyTitlePlatform: 'PS5',
      hasTrophyGroups: false,
      definedTrophies: { bronze: 0, silver: 0, gold: 0, platinum: 0 },
      progress: 100,
      earnedTrophies: { bronze: 42, silver: 8, gold: 2, platinum: 1 },
      hiddenFlag: false,
      lastUpdatedDateTime: '2021-08-15T21:22:08Z',
    }

    expect(trophyTitleToGame(title)).toEqual({
      id: 'psn-NPWR20188_00',
      platform: 'psn',
      title: "Astro's Playroom",
      coverUrl: 'https://example.com/astro.png',
      installed: false,
      sourceId: 'NPWR20188_00',
    })
  })
})
