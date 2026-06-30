/// <reference path="./global.d.ts" />

import { createDuplicateTitleLibrary, createMockLibrary } from '@test/fixtures/games'
import { expect, goToAppPage, setScanAllMock, test } from './fixtures'

test.describe('library search', () => {
  const mockLibrary = createMockLibrary()

  test.beforeEach(async ({ page }) => {
    await page.reload()
    await goToAppPage(page, 'library')
    await setScanAllMock(page, null)
  })

  test.afterEach(async ({ page }) => {
    await setScanAllMock(page, null)
  })

  test('shows all games with an empty search query', async ({ page }) => {
    await setScanAllMock(page, mockLibrary)

    await page.click('button:has-text("Scan libraries")')
    await expect(page.getByTestId('library-search')).toBeVisible()
    await expect(page.getByRole('searchbox', { name: 'Search games' })).toHaveValue('')
    await expect(page.getByTestId('game-library-grid').locator('article')).toHaveCount(3)
    await expect(page.getByText('(filtered)')).toHaveCount(0)
  })

  test('filters games by partial case-insensitive title match', async ({ page }) => {
    await setScanAllMock(page, mockLibrary)

    await page.click('button:has-text("Scan libraries")')
    await page.getByRole('searchbox', { name: 'Search games' }).fill('dota')

    await expect(page.getByText('(filtered)')).toBeVisible()
    await expect(page.getByText(/Last scan:.*— 1 games \(filtered\)/)).toBeVisible()

    const grid = page.getByTestId('game-library-grid')
    await expect(grid.locator('article')).toHaveCount(1)
    await expect(grid.getByText('Dota 2')).toBeVisible()
    await expect(grid.getByText('Alan Wake')).toHaveCount(0)
    await expect(grid.getByText('Cyberpunk 2077')).toHaveCount(0)
  })

  test('restores all games when search is cleared', async ({ page }) => {
    await setScanAllMock(page, mockLibrary)

    await page.click('button:has-text("Scan libraries")')
    const search = page.getByRole('searchbox', { name: 'Search games' })
    await search.fill('dota')
    await expect(page.getByTestId('game-library-grid').locator('article')).toHaveCount(1)

    await search.fill('')
    await expect(page.getByTestId('game-library-grid').locator('article')).toHaveCount(3)
    await expect(page.getByText('(filtered)')).toHaveCount(0)
  })

  test('shows empty state when search matches no games', async ({ page }) => {
    await setScanAllMock(page, mockLibrary)

    await page.click('button:has-text("Scan libraries")')
    await page.getByRole('searchbox', { name: 'Search games' }).fill('zelda')

    await expect(page.getByText(/No games match the current filters/i)).toBeVisible()
    await expect(page.getByTestId('game-library-grid')).toHaveCount(0)
    await expect(page.getByText('(filtered)')).toBeVisible()
  })

  test('filters games in list view', async ({ page }) => {
    await setScanAllMock(page, mockLibrary)

    await page.click('button:has-text("Scan libraries")')
    await page.getByRole('button', { name: 'List view' }).click()
    await page.getByRole('searchbox', { name: 'Search games' }).fill('cyber')

    const list = page.getByTestId('game-library-list')
    await expect(list.locator('li')).toHaveCount(1)
    await expect(list.getByText('Cyberpunk 2077')).toBeVisible()
    await expect(list.getByText('Alan Wake')).toHaveCount(0)
    await expect(list.getByText('Dota 2')).toHaveCount(0)
  })

  test('combines with platform filter to narrow results', async ({ page }) => {
    await setScanAllMock(page, mockLibrary)

    await page.click('button:has-text("Scan libraries")')
    await page.getByRole('button', { name: 'Steam' }).click()
    await page.getByRole('searchbox', { name: 'Search games' }).fill('dota')

    const grid = page.getByTestId('game-library-grid')
    await expect(grid.locator('article')).toHaveCount(1)
    await expect(grid.getByText('Dota 2')).toBeVisible()
    await expect(page.getByText('(filtered)')).toBeVisible()
  })

  test('combines with play status filter to narrow results', async ({ page }) => {
    await setScanAllMock(page, mockLibrary)

    await page.click('button:has-text("Scan libraries")')
    await page.getByRole('button', { name: 'Played', exact: true }).click()
    await page.getByRole('searchbox', { name: 'Search games' }).fill('alan')

    const grid = page.getByTestId('game-library-grid')
    await expect(grid.locator('article')).toHaveCount(1)
    await expect(grid.getByText('Alan Wake')).toBeVisible()
    await expect(grid.getByText('Dota 2')).toHaveCount(0)
    await expect(page.getByText('(filtered)')).toBeVisible()
  })

  test('shows empty state when search and platform filter exclude all games', async ({ page }) => {
    await setScanAllMock(page, mockLibrary)

    await page.click('button:has-text("Scan libraries")')
    await page.getByRole('button', { name: 'GOG' }).click()
    await page.getByRole('searchbox', { name: 'Search games' }).fill('dota')

    await expect(page.getByText(/No games match the current filters/i)).toBeVisible()
    await expect(page.getByTestId('game-library-grid')).toHaveCount(0)
    await expect(page.getByText('(filtered)')).toBeVisible()
  })

  test('matches merged duplicate titles ignoring colons', async ({ page }) => {
    await setScanAllMock(page, createDuplicateTitleLibrary())

    await page.click('button:has-text("Scan libraries")')
    await page.getByRole('searchbox', { name: 'Search games' }).fill('plague tale')

    const grid = page.getByTestId('game-library-grid')
    await expect(grid.locator('article')).toHaveCount(1)
    await expect(grid.getByText(/A Plague Tale/)).toBeVisible()
    await expect(grid.getByText('Dota 2')).toHaveCount(0)
  })
})
