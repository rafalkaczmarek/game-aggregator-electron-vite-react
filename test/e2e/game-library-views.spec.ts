/// <reference path="./global.d.ts" />

import { createMockLibrary } from '@test/fixtures/games'
import { expect, goToAppPage, setScanAllMock, test } from './fixtures'

test.describe('game library views', () => {
  const mockLibrary = createMockLibrary()

  test.beforeEach(async ({ page }) => {
    await page.reload()
    await goToAppPage(page, 'library')
    await setScanAllMock(page, null)
  })

  test.afterEach(async ({ page }) => {
    await setScanAllMock(page, null)
  })

  test('shows games in grid view by default after scan', async ({ page }) => {
    await setScanAllMock(page, mockLibrary)

    await page.click('button:has-text("Scan libraries")')
    await expect(page.getByText('Your games')).toBeVisible()
    await expect(page.getByTestId('game-library-grid')).toBeVisible()
    await expect(page.getByText('Alan Wake')).toBeVisible()
    await expect(page.getByText('Cyberpunk 2077')).toBeVisible()
    await expect(page.getByText('Dota 2')).toBeVisible()
    await expect(page.getByText('— 3 games')).toBeVisible()
  })

  test('switches between grid and list views', async ({ page }) => {
    await setScanAllMock(page, mockLibrary)

    await page.click('button:has-text("Scan libraries")')
    await expect(page.getByTestId('game-library-grid')).toBeVisible()

    await page.getByRole('button', { name: 'List view' }).click()
    const list = page.getByTestId('game-library-list')
    await expect(list).toBeVisible()
    await expect(page.getByTestId('game-library-grid')).toHaveCount(0)
    await expect(list.getByText('Not played')).toBeVisible()
    await expect(list.getByText('2.1 hrs')).toBeVisible()

    await page.getByRole('button', { name: 'Grid view' }).click()
    await expect(page.getByTestId('game-library-grid')).toBeVisible()
    await expect(page.getByTestId('game-library-list')).toHaveCount(0)
  })

  test('formats long playtime in list view', async ({ page }) => {
    const library = createMockLibrary([
      {
        id: 'steam-long',
        platform: 'steam',
        title: 'Long Game',
        installed: true,
        playtimeMinutes: 615,
        sourceId: 'long',
      },
    ])

    await setScanAllMock(page, library)
    await page.click('button:has-text("Scan libraries")')
    await page.getByRole('button', { name: 'List view' }).click()

    await expect(page.getByText('10 hrs')).toBeVisible()
  })

  test('shows cover placeholder when image fails to load', async ({ page }) => {
    const libraryWithBrokenCover = createMockLibrary([
      {
        id: 'steam-broken',
        platform: 'steam',
        title: 'Broken Cover Game',
        installed: true,
        coverUrl: 'https://invalid.invalid/cover.jpg',
        sourceId: 'broken',
      },
    ])

    await setScanAllMock(page, libraryWithBrokenCover)
    await page.click('button:has-text("Scan libraries")')
    await expect(page.getByText('Broken Cover Game')).toBeVisible()

    const grid = page.getByTestId('game-library-grid')
    await expect(grid.locator('img')).toHaveCount(0)
    await expect(grid.locator('svg')).toHaveCount(1)
  })

  test('shows empty state when scan returns no games', async ({ page }) => {
    await setScanAllMock(page, createMockLibrary([]))

    await page.click('button:has-text("Scan libraries")')
    await expect(page.getByText(/No games found/i)).toBeVisible()
    await expect(page.getByRole('button', { name: 'List view' })).toHaveCount(0)
    await expect(page.locator('[data-testid="platform-summary"] li')).toHaveCount(4)
  })
})
