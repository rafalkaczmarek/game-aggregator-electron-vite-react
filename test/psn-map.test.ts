import { describe, expect, it } from 'vitest'
import type { PurchasedGame, TrophyTitle } from 'psn-api'
import { purchasedGameToGame, trophyTitleToGame } from '../electron/scanners/psn/map'

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
