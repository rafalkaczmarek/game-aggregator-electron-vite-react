import type { PsnE2eFixture } from '../../electron/scanners/psn/e2e'

export const psnPurchasedGamesFixture: PsnE2eFixture = {
  purchasedGames: [
    {
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
    },
    {
      __typename: 'GameLibraryTitle',
      conceptId: '10005678',
      entitlementId: 'ENT456',
      image: {
        __typename: 'Media',
        url: 'https://example.com/astro.png',
      },
      isActive: true,
      isDownloadable: true,
      isPreOrder: false,
      membership: 'NONE',
      name: "Astro's Playroom",
      platform: 'PS5',
      productId: 'PROD456',
      titleId: 'PPSA01411_00',
    },
  ],
}

export const psnTrophyTitlesFixture: PsnE2eFixture = {
  accountId: 'e2e-public-account',
  userTitles: [
    {
      npServiceName: 'trophy2',
      npCommunicationId: 'NPWR20188_00',
      trophySetVersion: '01.00',
      trophyTitleName: "Astro's Playroom",
      trophyTitleIconUrl: 'https://example.com/astro-trophy.png',
      trophyTitlePlatform: 'PS5',
      hasTrophyGroups: false,
      definedTrophies: { bronze: 0, silver: 0, gold: 0, platinum: 0 },
      progress: 100,
      earnedTrophies: { bronze: 42, silver: 8, gold: 2, platinum: 1 },
      hiddenFlag: false,
      lastUpdatedDateTime: '2021-08-15T21:22:08Z',
    },
  ],
}
