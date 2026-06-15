/// <reference path="./global.d.ts" />

import { createDuplicateTitleLibrary, createMockLibrary } from '../fixtures/games'
import { expect, setScanAllMock, test } from './fixtures'

test.describe('play status filter', () => {
  const mockLibrary = createMockLibrary()

  test.beforeEach(async ({ page }) => {
    await page.reload()
    await page.waitForSelector('button:has-text("Scan libraries")')
    await setScanAllMock(page, null)
  })

  test.afterEach(async ({ page }) => {
    await setScanAllMock(page, null)
  })

  test('shows all games by default', async ({ page }) => {
    await setScanAllMock(page, mockLibrary)

    await page.click('button:has-text("Scan libraries")')
    await expect(page.getByTestId('play-status-filter')).toBeVisible()
    await expect(page.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('game-library-grid').locator('li')).toHaveCount(3)
    await expect(page.getByText('(filtered)')).toHaveCount(0)
  })

  test('filters to played games only', async ({ page }) => {
    await setScanAllMock(page, mockLibrary)

    await page.click('button:has-text("Scan libraries")')
    await page.getByRole('button', { name: 'Played', exact: true }).click()

    await expect(page.getByRole('button', { name: 'Played', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(page.getByText('(filtered)')).toBeVisible()
    await expect(page.getByText(/Last scan:.*— 2 games \(filtered\)/)).toBeVisible()

    const grid = page.getByTestId('game-library-grid')
    await expect(grid.locator('li')).toHaveCount(2)
    await expect(grid.getByText('Alan Wake')).toBeVisible()
    await expect(grid.getByText('Dota 2')).toBeVisible()
    await expect(grid.getByText('Cyberpunk 2077')).toHaveCount(0)
  })

  test('filters to unplayed games only', async ({ page }) => {
    await setScanAllMock(page, mockLibrary)

    await page.click('button:has-text("Scan libraries")')
    await page.getByRole('button', { name: 'Not played' }).click()

    await expect(page.getByRole('button', { name: 'Not played' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(page.getByText('(filtered)')).toBeVisible()
    await expect(page.getByText(/Last scan:.*— 1 games \(filtered\)/)).toBeVisible()

    const grid = page.getByTestId('game-library-grid')
    await expect(grid.locator('li')).toHaveCount(1)
    await expect(grid.getByText('Cyberpunk 2077')).toBeVisible()
    await expect(grid.getByText('Alan Wake')).toHaveCount(0)
    await expect(grid.getByText('Dota 2')).toHaveCount(0)
  })

  test('restores all games when switching back to All', async ({ page }) => {
    await setScanAllMock(page, mockLibrary)

    await page.click('button:has-text("Scan libraries")')
    await page.getByRole('button', { name: 'Played', exact: true }).click()
    await expect(page.getByTestId('game-library-grid').locator('li')).toHaveCount(2)

    await page.getByRole('button', { name: 'All' }).click()
    await expect(page.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('game-library-grid').locator('li')).toHaveCount(3)
    await expect(page.getByText('(filtered)')).toHaveCount(0)
  })

  test('filters unplayed games in list view', async ({ page }) => {
    await setScanAllMock(page, mockLibrary)

    await page.click('button:has-text("Scan libraries")')
    await page.getByRole('button', { name: 'List view' }).click()
    await page.getByRole('button', { name: 'Not played' }).click()

    const list = page.getByTestId('game-library-list')
    await expect(list.locator('li')).toHaveCount(1)

    const row = list.locator('li', { hasText: 'Cyberpunk 2077' })
    await expect(row).toBeVisible()
    await expect(row.getByText('Not played')).toBeVisible()
    await expect(list.getByText('Alan Wake')).toHaveCount(0)
    await expect(list.getByText('Dota 2')).toHaveCount(0)
  })

  test('combines with platform filter to narrow results', async ({ page }) => {
    await setScanAllMock(page, mockLibrary)

    await page.click('button:has-text("Scan libraries")')
    await page.getByRole('button', { name: 'Steam' }).click()
    await page.getByRole('button', { name: 'Played', exact: true }).click()

    const grid = page.getByTestId('game-library-grid')
    await expect(grid.locator('li')).toHaveCount(1)
    await expect(grid.getByText('Dota 2')).toBeVisible()
    await expect(page.getByText('(filtered)')).toBeVisible()
  })

  test('shows empty state when platform and play status filters exclude all games', async ({
    page,
  }) => {
    await setScanAllMock(page, mockLibrary)

    await page.click('button:has-text("Scan libraries")')
    await page.getByRole('button', { name: 'Steam' }).click()
    await page.getByRole('button', { name: 'Not played' }).click()

    await expect(page.getByText(/No games match the current filters/i)).toBeVisible()
    await expect(page.getByTestId('game-library-grid')).toHaveCount(0)
    await expect(page.getByText('(filtered)')).toBeVisible()
  })

  test('treats merged duplicate titles as played when any platform has playtime', async ({
    page,
  }) => {
    await setScanAllMock(page, createDuplicateTitleLibrary())

    await page.click('button:has-text("Scan libraries")')
    await page.getByRole('button', { name: 'Played', exact: true }).click()

    const grid = page.getByTestId('game-library-grid')
    await expect(grid.locator('li')).toHaveCount(2)
    await expect(page.getByText('A Plague Tale: Innocence')).toBeVisible()
    await expect(page.getByText('Dota 2')).toBeVisible()
    await expect(page.getByText('2.5 hrs')).toBeVisible()
  })

  test('excludes merged titles with zero playtime on every platform', async ({ page }) => {
    const library = createMockLibrary([
      {
        id: 'gog-idle',
        platform: 'gog',
        title: 'Idle Game',
        installed: false,
      },
      {
        id: 'epic-idle',
        platform: 'epic',
        title: 'Idle Game',
        installed: true,
        playtimeMinutes: 0,
      },
      {
        id: 'steam-played',
        platform: 'steam',
        title: 'Played Game',
        installed: true,
        playtimeMinutes: 60,
      },
    ])

    await setScanAllMock(page, library)
    await page.click('button:has-text("Scan libraries")')
    await page.getByRole('button', { name: 'Not played' }).click()

    const grid = page.getByTestId('game-library-grid')
    await expect(grid.locator('li')).toHaveCount(1)
    await expect(grid.getByText('Idle Game')).toBeVisible()
    await expect(grid.getByText('Played Game')).toHaveCount(0)
  })

  test('shows empty state when every game has playtime and Not played is selected', async ({
    page,
  }) => {
    const library = createMockLibrary([
      {
        id: 'steam-only',
        platform: 'steam',
        title: 'Short Session',
        installed: true,
        playtimeMinutes: 5,
      },
    ])

    await setScanAllMock(page, library)
    await page.click('button:has-text("Scan libraries")')
    await page.getByRole('button', { name: 'Not played' }).click()

    await expect(page.getByText(/No games match the current filters/i)).toBeVisible()
    await expect(page.getByTestId('game-library-grid')).toHaveCount(0)
  })
})
