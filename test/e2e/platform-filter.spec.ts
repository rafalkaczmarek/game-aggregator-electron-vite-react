/// <reference path="./global.d.ts" />

import { createDuplicateTitleLibrary, createMockLibrary } from '../fixtures/games'
import { expect, setScanAllMock, test } from './fixtures'

test.describe('platform filter', () => {
  const mockLibrary = createMockLibrary()

  test.beforeEach(async ({ page }) => {
    await page.reload()
    await page.waitForSelector('button:has-text("Scan libraries")')
    await setScanAllMock(page, null)
  })

  test.afterEach(async ({ page }) => {
    await setScanAllMock(page, null)
  })

  test('shows all games by default with no platforms selected', async ({ page }) => {
    await setScanAllMock(page, mockLibrary)

    await page.click('button:has-text("Scan libraries")')
    await expect(page.getByTestId('platform-filter')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Steam' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    await expect(page.getByRole('button', { name: 'GOG' })).toHaveAttribute('aria-pressed', 'false')

    const grid = page.getByTestId('game-library-grid')
    await expect(grid.locator('li')).toHaveCount(3)
    await expect(page.getByText('— 3 games')).toBeVisible()
    await expect(page.getByText('(filtered)')).toHaveCount(0)
  })

  test('filters to a single platform when selected', async ({ page }) => {
    await setScanAllMock(page, mockLibrary)

    await page.click('button:has-text("Scan libraries")')
    await page.getByRole('button', { name: 'Steam' }).click()

    await expect(page.getByRole('button', { name: 'Steam' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(page.getByText('(filtered)')).toBeVisible()
    await expect(page.getByText(/Last scan:.*— 1 games \(filtered\)/)).toBeVisible()

    const grid = page.getByTestId('game-library-grid')
    await expect(grid.locator('li')).toHaveCount(1)
    await expect(grid.getByText('Dota 2')).toBeVisible()
    await expect(grid.getByText('Alan Wake')).toHaveCount(0)
    await expect(grid.getByText('Cyberpunk 2077')).toHaveCount(0)
  })

  test('restores all games when the last selected platform is cleared', async ({ page }) => {
    await setScanAllMock(page, mockLibrary)

    await page.click('button:has-text("Scan libraries")')
    await page.getByRole('button', { name: 'Epic' }).click()
    await expect(page.getByTestId('game-library-grid').locator('li')).toHaveCount(1)

    await page.getByRole('button', { name: 'Epic' }).click()
    await expect(page.getByRole('button', { name: 'Epic' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    await expect(page.getByTestId('game-library-grid').locator('li')).toHaveCount(3)
    await expect(page.getByText('(filtered)')).toHaveCount(0)
  })

  test('shows games from multiple selected platforms', async ({ page }) => {
    await setScanAllMock(page, mockLibrary)

    await page.click('button:has-text("Scan libraries")')
    await page.getByRole('button', { name: 'Steam' }).click()
    await page.getByRole('button', { name: 'GOG' }).click()

    const grid = page.getByTestId('game-library-grid')
    await expect(grid.locator('li')).toHaveCount(2)
    await expect(grid.getByText('Dota 2')).toBeVisible()
    await expect(grid.getByText('Cyberpunk 2077')).toBeVisible()
    await expect(grid.getByText('Alan Wake')).toHaveCount(0)
  })

  test('shows empty state when selected platform has no games', async ({ page }) => {
    await setScanAllMock(page, mockLibrary)

    await page.click('button:has-text("Scan libraries")')
    await page.getByRole('button', { name: 'PSN' }).click()

    await expect(page.getByText(/No games match the selected platforms/i)).toBeVisible()
    await expect(page.getByTestId('game-library-grid')).toHaveCount(0)
    await expect(page.getByText('(filtered)')).toBeVisible()
  })

  test('filters merged duplicate titles to the selected platform only', async ({ page }) => {
    await setScanAllMock(page, createDuplicateTitleLibrary())

    await page.click('button:has-text("Scan libraries")')
    await page.getByRole('button', { name: 'GOG' }).click()

    const grid = page.getByTestId('game-library-grid')
    await expect(grid.locator('li')).toHaveCount(1)
    await expect(grid.getByText(/A Plague Tale/)).toBeVisible()
    await expect(grid.getByText('GOG')).toBeVisible()
    await expect(grid.getByText('Epic')).toHaveCount(0)
    await expect(grid.getByText('Dota 2')).toHaveCount(0)
    await expect(page.getByText('2.0 hrs')).toBeVisible()
    await expect(page.getByText('Installed')).toHaveCount(0)
  })
})
