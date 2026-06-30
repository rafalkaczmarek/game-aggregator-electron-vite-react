/// <reference path="./global.d.ts" />

import { createLargeMockLibrary, createMockLibrary, createMockLibraryWithMetacritic } from '@test/fixtures/games'
import {
  expect,
  goToAppPage,
  resetGameDescriptionMock,
  setGameDescriptionMock,
  test,
  writeLibraryCache,
} from './fixtures'

test.describe('game detail page', () => {
  const mockLibrary = createMockLibrary()

  async function scrollUntilGameLinkVisible(
    page: import('@playwright/test').Page,
    containerTestId: 'game-library-grid' | 'game-library-list',
    gameKey: string,
  ) {
    const container = page.getByTestId(containerTestId)

    await expect
      .poll(
        async () =>
          container.evaluate((element, key) => {
            const selector = `[data-testid="game-link-${key}"]`
            if (element.querySelector(selector)) {
              return true
            }

            element.scrollTop = Math.min(element.scrollTop + 400, element.scrollHeight)
            return Boolean(element.querySelector(selector))
          }, gameKey),
        { timeout: 15_000 },
      )
      .toBe(true)
  }

  test.beforeEach(async ({ page }) => {
    await page.reload()
    await goToAppPage(page, 'library')
    await writeLibraryCache(page, mockLibrary)
    await page.reload()
    await goToAppPage(page, 'library')
  })

  test('opens game detail page from grid view', async ({ page }) => {
    await expect(page.getByText('Your games')).toBeVisible()
    await page.getByTestId('game-link-dota 2').click()

    await expect(page.getByTestId('game-detail-page')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Dota 2' })).toBeVisible()
    await expect(page.getByText('Total playtime: 2.1 hrs')).toBeVisible()
    await expect(page.getByText('Platforms')).toBeVisible()
  })

  test('opens game detail page from list view', async ({ page }) => {
    await page.getByRole('button', { name: 'List view' }).click()
    await page.getByTestId('game-link-cyberpunk 2077').click()

    await expect(page.getByTestId('game-detail-page')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Cyberpunk 2077' })).toBeVisible()
  })

  test('returns to library from detail page', async ({ page }) => {
    await page.getByTestId('game-link-alan wake').click()
    await expect(page.getByTestId('game-detail-page')).toBeVisible()

    await page.getByRole('button', { name: '← Back to library' }).click()

    await expect(page.getByText('Your games')).toBeVisible()
    await expect(page.getByTestId('game-detail-page')).toHaveCount(0)
  })

  test('restores grid scroll position when returning from game detail', async ({ page }) => {
    const largeLibrary = createLargeMockLibrary(100)
    await writeLibraryCache(page, largeLibrary)
    await page.reload()
    await goToAppPage(page, 'library')

    const grid = page.getByTestId('game-library-grid')
    const targetKey = 'game 0099'
    const targetTitle = 'Game 0099'

    await grid.evaluate((element) => {
      element.scrollTop = element.scrollHeight
    })
    await expect(grid.getByTestId(`game-link-${targetKey}`)).toBeVisible()

    const scrollBefore = await grid.evaluate((element) => element.scrollTop)
    expect(scrollBefore).toBeGreaterThan(0)

    await page.getByTestId(`game-link-${targetKey}`).click()
    await expect(page.getByTestId('game-detail-page')).toBeVisible()
    await expect(page.getByRole('heading', { name: targetTitle })).toBeVisible()

    await page.getByRole('button', { name: '← Back to library' }).click()
    await expect(grid).toBeVisible()

    await expect
      .poll(async () => grid.evaluate((element) => element.scrollTop))
      .toBeGreaterThanOrEqual(scrollBefore - 20)

    await expect(grid.getByTestId(`game-link-${targetKey}`)).toBeVisible()
  })

  test('restores list view scroll position when returning from game detail', async ({ page }) => {
    const largeLibrary = createLargeMockLibrary(100)
    await writeLibraryCache(page, largeLibrary)
    await page.reload()
    await goToAppPage(page, 'library')

    await page.getByRole('button', { name: 'List view' }).click()
    const list = page.getByTestId('game-library-list')
    const targetKey = 'game 0075'
    const targetTitle = 'Game 0075'

    await scrollUntilGameLinkVisible(page, 'game-library-list', targetKey)

    const scrollBefore = await list.evaluate((element) => element.scrollTop)
    expect(scrollBefore).toBeGreaterThan(0)

    await page.getByTestId(`game-link-${targetKey}`).click()
    await expect(page.getByRole('heading', { name: targetTitle })).toBeVisible()

    await page.getByRole('button', { name: '← Back to library' }).click()
    await expect(list).toBeVisible()
    await expect(page.getByRole('button', { name: 'List view' })).toHaveAttribute('aria-pressed', 'true')

    await expect
      .poll(async () => list.evaluate((element) => element.scrollTop))
      .toBeGreaterThanOrEqual(scrollBefore - 20)

    await expect(list.getByTestId(`game-link-${targetKey}`)).toBeVisible()
  })

  test('restores search filter when returning from game detail', async ({ page }) => {
    await page.getByRole('searchbox', { name: 'Search games' }).fill('alan')
    await expect(page.getByTestId('game-link-alan wake')).toBeVisible()
    await expect(page.getByTestId('game-link-dota 2')).toHaveCount(0)

    await page.getByTestId('game-link-alan wake').click()
    await expect(page.getByTestId('game-detail-page')).toBeVisible()

    await page.getByRole('button', { name: '← Back to library' }).click()

    await expect(page.getByRole('searchbox', { name: 'Search games' })).toHaveValue('alan')
    await expect(page.getByTestId('game-link-alan wake')).toBeVisible()
    await expect(page.getByTestId('game-link-dota 2')).toHaveCount(0)
  })

  test('shows unavailable description for non-Steam games', async ({ page }) => {
    await page.getByTestId('game-link-cyberpunk 2077').click()

    await expect(page.getByTestId('game-detail-page')).toBeVisible()
    await expect(page.getByText('No description available for this game yet.')).toBeVisible()
  })

  test('shows not found page for unknown game key', async ({ page }) => {
    await page.evaluate(() => {
      window.location.hash = '#/library/unknown-game-key'
    })

    await expect(page.getByTestId('game-detail-not-found')).toBeVisible()
    await expect(
      page.getByText('Game not found. It may have been removed from your library since the last scan.'),
    ).toBeVisible()

    await page.getByRole('button', { name: '← Back to library' }).click()
    await expect(page.getByText('Your games')).toBeVisible()
  })

  test('shows metacritic badge and installed label on detail page', async ({ page }) => {
    await writeLibraryCache(page, createMockLibraryWithMetacritic())
    await page.reload()
    await goToAppPage(page, 'library')

    await page.getByTestId('game-link-dota 2').click()
    await expect(page.getByTestId('game-detail-page')).toBeVisible()
    await expect(page.getByLabel('Metascore: 90')).toBeVisible()
    await expect(page.getByLabel('User score: 6.8')).toBeVisible()
    await expect(page.getByText('Installed')).toBeVisible()

    await page.getByRole('button', { name: '← Back to library' }).click()
    await page.getByTestId('game-link-alan wake').click()
    await expect(page.getByText('Installed')).toBeVisible()
  })

  test('shows steam game description from mocked store response', async ({ page }) => {
    await setGameDescriptionMock(page, {
      text: 'Every day, millions of players worldwide enter battle as one of over a hundred Dota heroes.',
      source: 'steam',
    })

    await page.getByTestId('game-link-dota 2').click()
    await expect(page.getByTestId('game-detail-page')).toBeVisible()
    await expect(page.getByText(/millions of players worldwide/i)).toBeVisible()

    await resetGameDescriptionMock(page)
  })
})
