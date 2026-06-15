/// <reference path="./global.d.ts" />

import path from 'node:path'
import { expect, goToAppPage, root, setGogGalaxyDb, setScanAllMock, test } from './fixtures'

test.describe('GOG scanner', () => {
  const fixtureDb = path.join(root, 'test', 'fixtures', 'gog', 'galaxy-2.0.db')

  test.afterEach(async ({ page }) => {
    await setGogGalaxyDb(page, null)
    await setScanAllMock(page, null)
  })

  test('gog platform scan returns a result via IPC', async ({ page }) => {
    test.setTimeout(60_000)

    const result = await page.evaluate(() => window.gameApi.scanPlatform('gog'))

    expect(result.platform).toBe('gog')
    expect(Array.isArray(result.games)).toBe(true)
    expect(Array.isArray(result.errors)).toBe(true)
    expect(result.errors.some((error) => error.includes('not implemented'))).toBe(false)
  })

  test('gog platform scan reads games from Galaxy fixture database', async ({ page }) => {
    test.setTimeout(60_000)

    await setGogGalaxyDb(page, fixtureDb)

    const result = await page.evaluate(() => window.gameApi.scanPlatform('gog'))

    expect(result.platform).toBe('gog')
    expect(result.errors).toEqual([])
    expect(result.games).toHaveLength(2)
    expect(result.games.map((game) => game.title)).toEqual([
      'Cyberpunk 2077',
      'The Witcher 3: Wild Hunt',
    ])
  })

  test('scanAll loads GOG and Steam games from Galaxy fixture database', async ({ page }) => {
    test.setTimeout(60_000)

    await setGogGalaxyDb(page, fixtureDb)

    const library = await page.evaluate(() => window.gameApi.scanAll())

    expect(library.games).toHaveLength(3)
    expect(library.games.map((game) => game.title).sort()).toEqual([
      'Cyberpunk 2077',
      'Dota 2',
      'The Witcher 3: Wild Hunt',
    ])

    const gogResult = library.results.find((result) => result.platform === 'gog')
    const steamResult = library.results.find((result) => result.platform === 'steam')
    const epicResult = library.results.find((result) => result.platform === 'epic')
    const psnResult = library.results.find((result) => result.platform === 'psn')

    expect(gogResult?.games).toHaveLength(2)
    expect(gogResult?.errors).toEqual([])
    expect(steamResult?.games).toHaveLength(1)
    expect(steamResult?.games[0]?.title).toBe('Dota 2')
    expect(steamResult?.errors).toEqual([])
    expect(epicResult?.games).toHaveLength(0)
    expect(epicResult?.errors[0]).toContain('not implemented')
    expect(psnResult?.games).toHaveLength(0)
    expect(psnResult?.errors[0]).toContain('NPSSO')
  })

  test('scan libraries UI shows GOG games from Galaxy fixture database', async ({ page }) => {
    test.setTimeout(60_000)

    await setGogGalaxyDb(page, fixtureDb)
    await page.reload()
    await goToAppPage(page, 'library')

    await page.click('button:has-text("Scan libraries")')
    await page.waitForSelector('text=Last scan:')

    await expect(page.getByText('Cyberpunk 2077')).toBeVisible()
    await expect(page.getByText('The Witcher 3: Wild Hunt')).toBeVisible()
    await expect(page.getByText('Dota 2')).toBeVisible()
    await expect(page.getByText('— 3 games')).toBeVisible()

    const gogRow = page.locator('[data-testid="platform-summary"] li', { hasText: 'gog' })
    await expect(gogRow).toContainText('2 games')
    await expect(gogRow).not.toContainText('not implemented')
  })
})
