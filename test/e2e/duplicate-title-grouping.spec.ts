/// <reference path="./global.d.ts" />

import { createDuplicateTitleLibrary, createMockLibrary } from '../fixtures/games'
import { expect, goToAppPage, setScanAllMock, test } from './fixtures'

test.describe('duplicate title grouping', () => {
  test.beforeEach(async ({ page }) => {
    await page.reload()
    await goToAppPage(page, 'library')
    await setScanAllMock(page, null)
  })

  test.afterEach(async ({ page }) => {
    await setScanAllMock(page, null)
  })

  test('merges same game across platforms into one grid tile', async ({ page }) => {
    await setScanAllMock(page, createDuplicateTitleLibrary())

    await page.click('button:has-text("Scan libraries")')
    await expect(page.getByText('Your games')).toBeVisible()

    const grid = page.getByTestId('game-library-grid')
    await expect(grid.locator('li')).toHaveCount(2)
    await expect(page.getByText('A Plague Tale: Innocence')).toBeVisible()
    await expect(grid.getByText('GOG')).toBeVisible()
    await expect(grid.getByText('Epic')).toBeVisible()
    await expect(page.getByText('2.5 hrs')).toBeVisible()
    await expect(page.getByText('— 2 games')).toBeVisible()
    await expect(page.getByText('(3 across platforms)')).toBeVisible()
  })

  test('shows multiple platform badges in list view for merged titles', async ({ page }) => {
    await setScanAllMock(page, createDuplicateTitleLibrary())

    await page.click('button:has-text("Scan libraries")')
    await page.getByRole('button', { name: 'List view' }).click()

    const list = page.getByTestId('game-library-list')
    await expect(list.locator('li')).toHaveCount(2)

    const plagueRow = list.locator('li', { hasText: 'A Plague Tale: Innocence' })
    await expect(plagueRow.getByText('GOG')).toBeVisible()
    await expect(plagueRow.getByText('Epic')).toBeVisible()
    await expect(plagueRow.getByText('Installed')).toBeVisible()
  })

  test('merges titles with trademark symbols and different apostrophes', async ({ page }) => {
    const library = createMockLibrary([
      {
        id: 'steam-cod',
        platform: 'steam',
        title: 'Call of Duty®: Modern Warfare',
        installed: false,
        playtimeMinutes: 90,
      },
      {
        id: 'gog-cod',
        platform: 'gog',
        title: 'Call of Duty Modern Warfare\u2122',
        installed: true,
        playtimeMinutes: 30,
      },
    ])

    await setScanAllMock(page, library)
    await page.click('button:has-text("Scan libraries")')

    const grid = page.getByTestId('game-library-grid')
    await expect(grid.locator('li')).toHaveCount(1)
    await expect(page.getByText('Call of Duty: Modern Warfare')).toBeVisible()
    await expect(grid.getByText('Steam')).toBeVisible()
    await expect(grid.getByText('GOG')).toBeVisible()
    await expect(page.getByText('2.0 hrs')).toBeVisible()
  })
})
