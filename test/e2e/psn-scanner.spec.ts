/// <reference path="./global.d.ts" />

import path from 'node:path'
import {
  configurePsnScan,
  expect,
  root,
  setGogGalaxyDb,
  setScanAllMock,
  test,
} from './fixtures'
import { psnPurchasedGamesFixture } from '../fixtures/psn'

test.describe('PSN scanner', () => {
  const fixtureDb = path.join(root, 'test', 'fixtures', 'gog', 'galaxy-2.0.db')

  test.afterEach(async ({ page }) => {
    await configurePsnScan(page, null)
    await setGogGalaxyDb(page, null)
    await setScanAllMock(page, null)
  })

  test('psn platform scan returns a result via IPC', async ({ page }) => {
    test.setTimeout(60_000)

    const result = await page.evaluate(() => window.gameApi.scanPlatform('psn'))

    expect(result.platform).toBe('psn')
    expect(Array.isArray(result.games)).toBe(true)
    expect(Array.isArray(result.errors)).toBe(true)
    expect(result.errors.some((error) => error.includes('not implemented'))).toBe(false)
  })

  test('psn platform scan requires NPSSO when no fixture is configured', async ({ page }) => {
    test.setTimeout(60_000)

    await page.evaluate(() =>
      window.settingsApi.update({ psnNpsso: '', psnOnlineId: '' }),
    )

    const result = await page.evaluate(() => window.gameApi.scanPlatform('psn'))

    expect(result.platform).toBe('psn')
    expect(result.games).toHaveLength(0)
    expect(result.errors[0]).toContain('NPSSO')
  })

  test('psn platform scan reads purchased games from e2e fixture', async ({ page }) => {
    test.setTimeout(60_000)

    await configurePsnScan(page, psnPurchasedGamesFixture)

    const result = await page.evaluate(() => window.gameApi.scanPlatform('psn'))

    expect(result.platform).toBe('psn')
    expect(result.errors).toEqual([])
    expect(result.games).toHaveLength(2)
    expect(result.games.map((game) => game.title)).toEqual([
      "Astro's Playroom",
      "Marvel's Spider-Man",
    ])
    expect(result.games[0]).toMatchObject({
      id: 'psn-PPSA01411_00',
      platform: 'psn',
      sourceId: 'PPSA01411_00',
    })
  })

  test('psn platform scan reads trophy titles when online id is configured', async ({ page }) => {
    test.setTimeout(60_000)

    await page.evaluate(async () => {
      await window.settingsApi.update({
        psnNpsso: 'e2e-npsso-token',
        psnOnlineId: 'public-player',
      })
      await window.__e2e.setPsnFixture({
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
      })
    })

    const result = await page.evaluate(() => window.gameApi.scanPlatform('psn'))

    expect(result.platform).toBe('psn')
    expect(result.errors).toEqual([])
    expect(result.games).toHaveLength(1)
    expect(result.games[0]).toMatchObject({
      id: 'psn-NPWR20188_00',
      title: "Astro's Playroom",
      platform: 'psn',
    })
  })

  test('scanAll loads PSN purchased games from e2e fixture alongside GOG data', async ({
    page,
  }) => {
    test.setTimeout(60_000)

    await setGogGalaxyDb(page, fixtureDb)
    await configurePsnScan(page, psnPurchasedGamesFixture)

    const library = await page.evaluate(() => window.gameApi.scanAll())

    expect(library.games.map((game) => game.title).sort()).toEqual([
      "Astro's Playroom",
      'Cyberpunk 2077',
      'Dota 2',
      "Marvel's Spider-Man",
      'The Witcher 3: Wild Hunt',
    ])

    const psnResult = library.results.find((result) => result.platform === 'psn')

    expect(psnResult?.games).toHaveLength(2)
    expect(psnResult?.errors).toEqual([])
  })

  test('scan libraries UI shows PSN games from e2e fixture', async ({ page }) => {
    test.setTimeout(60_000)

    await setGogGalaxyDb(page, fixtureDb)
    await page.reload()
    await page.waitForSelector('button:has-text("Scan libraries")')
    await configurePsnScan(page, psnPurchasedGamesFixture)

    await page.click('button:has-text("Scan libraries")')
    await page.waitForSelector('text=Last scan:')

    await page.getByRole('button', { name: 'PSN' }).click()

    await expect(page.getByText("Marvel's Spider-Man")).toBeVisible()
    await expect(page.getByText("Astro's Playroom")).toBeVisible()

    const psnRow = page.locator('[data-testid="platform-summary"] li', { hasText: 'psn' })
    await expect(psnRow).toContainText('2 games')
    await expect(psnRow).not.toContainText('not implemented')
    await expect(psnRow).not.toContainText('NPSSO')
  })
})
