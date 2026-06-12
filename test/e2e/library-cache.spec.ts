/// <reference path="./global.d.ts" />

import { createMockLibrary } from '../fixtures/games'
import { clearLibraryCache, expect, setScanAllMock, test, writeLibraryCache } from './fixtures'

test.describe('library cache', () => {
  test.beforeEach(async ({ page }) => {
    await clearLibraryCache(page)
    await setScanAllMock(page, null)
    await page.reload()
    await page.waitForSelector('button:has-text("Scan libraries")')
  })

  test.afterEach(async ({ page }) => {
    await clearLibraryCache(page)
    await setScanAllMock(page, null)
  })

  test('shows no library until first scan when cache is missing', async ({ page }) => {
    await expect(page.getByText('Last scan:')).toHaveCount(0)
    await expect(page.getByText('Your games')).toHaveCount(0)
  })

  test('loads cached library on startup without scanning', async ({ page }) => {
    const mockLibrary = createMockLibrary()
    await writeLibraryCache(page, mockLibrary)

    await page.reload()
    await page.waitForSelector('button:has-text("Scan libraries")')

    await expect(page.getByText('Your games')).toBeVisible()
    await expect(page.getByTestId('game-library-grid')).toBeVisible()
    await expect(page.getByText('Alan Wake')).toBeVisible()
    await expect(page.getByText('Cyberpunk 2077')).toBeVisible()
    await expect(page.getByText('Dota 2')).toBeVisible()
    await expect(page.getByText('— 3 games')).toBeVisible()
    await expect(page.locator('[data-testid="platform-summary"] li')).toHaveCount(4)
  })

  test('getLibrary returns cached library via IPC', async ({ page }) => {
    const mockLibrary = createMockLibrary()
    await writeLibraryCache(page, mockLibrary)

    const cached = await page.evaluate(() => window.gameApi.getLibrary())

    expect(cached).not.toBeNull()
    expect(cached?.scannedAt).toBe(mockLibrary.scannedAt)
    expect(cached?.games).toHaveLength(3)
    expect(cached?.results).toHaveLength(4)
  })

  test('persists library after scan and restores it on reload', async ({ page }) => {
    test.setTimeout(60_000)

    await page.click('button:has-text("Scan libraries")')
    await page.waitForSelector('text=Last scan:')

    const cached = await page.evaluate(() => window.gameApi.getLibrary())
    expect(cached).not.toBeNull()
    expect(Array.isArray(cached?.games)).toBe(true)
    expect(typeof cached?.scannedAt).toBe('string')
    expect(cached?.results).toHaveLength(4)

    await page.reload()
    await page.waitForSelector('text=Last scan:')

    const restored = await page.evaluate(() => window.gameApi.getLibrary())
    expect(restored).not.toBeNull()
    expect(restored?.scannedAt).toBe(cached?.scannedAt)
    expect(restored?.games.length).toBe(cached?.games.length)
    await expect(page.locator('[data-testid="platform-summary"] li')).toHaveCount(4)
  })
})
