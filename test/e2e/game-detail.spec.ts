/// <reference path="./global.d.ts" />

import { createMockLibrary } from '@test/fixtures/games'
import { expect, goToAppPage, test, writeLibraryCache } from './fixtures'

test.describe('game detail page', () => {
  const mockLibrary = createMockLibrary()

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
})
