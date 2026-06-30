/// <reference path="./global.d.ts" />

import type { Page } from '@playwright/test'
import { createDuplicateTitleLibrary, createMockLibrary, createMockLibraryWithMetacritic } from '@test/fixtures/games'
import { expect, goToAppPage, setScanAllMock, test } from './fixtures'

async function getVisibleGameTitles(page: Page, view: 'grid' | 'list' = 'grid') {
  const testId = view === 'grid' ? 'game-library-grid' : 'game-library-list'
  const titleSelector = view === 'grid' ? 'article p.font-medium' : 'li p.font-medium'
  return page.getByTestId(testId).locator(titleSelector).allTextContents()
}

test.describe('library sort', () => {
  const mockLibrary = createMockLibrary()

  test.beforeEach(async ({ page }) => {
    await page.reload()
    await goToAppPage(page, 'library')
    await setScanAllMock(page, null)
  })

  test.afterEach(async ({ page }) => {
    await setScanAllMock(page, null)
  })

  test('sorts alphabetically by title by default', async ({ page }) => {
    await setScanAllMock(page, mockLibrary)

    await page.click('button:has-text("Scan libraries")')
    await expect(page.getByTestId('library-sort')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Title', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await expect(await getVisibleGameTitles(page)).toEqual([
      'Alan Wake',
      'Cyberpunk 2077',
      'Dota 2',
    ])
    await expect(page.getByText('(filtered)')).toHaveCount(0)
  })

  test('sorts by most played in grid view', async ({ page }) => {
    await setScanAllMock(page, mockLibrary)

    await page.click('button:has-text("Scan libraries")')
    await page.getByRole('button', { name: 'Most played', exact: true }).click()

    await expect(page.getByRole('button', { name: 'Most played', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(await getVisibleGameTitles(page)).toEqual([
      'Dota 2',
      'Alan Wake',
      'Cyberpunk 2077',
    ])
    await expect(page.getByText('(filtered)')).toHaveCount(0)
  })

  test('sorts by least played in grid view', async ({ page }) => {
    await setScanAllMock(page, mockLibrary)

    await page.click('button:has-text("Scan libraries")')
    await page.getByRole('button', { name: 'Least played', exact: true }).click()

    await expect(page.getByRole('button', { name: 'Least played', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(await getVisibleGameTitles(page)).toEqual([
      'Cyberpunk 2077',
      'Alan Wake',
      'Dota 2',
    ])
  })

  test('sorts by most played in list view', async ({ page }) => {
    await setScanAllMock(page, mockLibrary)

    await page.click('button:has-text("Scan libraries")')
    await page.getByRole('button', { name: 'List view' }).click()
    await page.getByRole('button', { name: 'Most played', exact: true }).click()

    await expect(await getVisibleGameTitles(page, 'list')).toEqual([
      'Dota 2',
      'Alan Wake',
      'Cyberpunk 2077',
    ])
  })

  test('restores alphabetical order when switching back to Title', async ({ page }) => {
    await setScanAllMock(page, mockLibrary)

    await page.click('button:has-text("Scan libraries")')
    await page.getByRole('button', { name: 'Most played', exact: true }).click()
    await expect(await getVisibleGameTitles(page)).toEqual([
      'Dota 2',
      'Alan Wake',
      'Cyberpunk 2077',
    ])

    await page.getByRole('button', { name: 'Title', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Title', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(await getVisibleGameTitles(page)).toEqual([
      'Alan Wake',
      'Cyberpunk 2077',
      'Dota 2',
    ])
  })

  test('sorts merged duplicate titles by summed playtime', async ({ page }) => {
    await setScanAllMock(page, createDuplicateTitleLibrary())

    await page.click('button:has-text("Scan libraries")')
    await page.getByRole('button', { name: 'Most played', exact: true }).click()

    await expect(await getVisibleGameTitles(page)).toEqual([
      'A Plague Tale: Innocence',
      'Dota 2',
    ])
    await expect(page.getByText('2.5 hrs')).toBeVisible()
    await expect(page.getByText('2.1 hrs')).toBeVisible()
  })

  test('combines with play status filter without treating sort as a filter', async ({ page }) => {
    await setScanAllMock(page, mockLibrary)

    await page.click('button:has-text("Scan libraries")')
    await page.getByRole('button', { name: 'Played', exact: true }).click()
    await page.getByRole('button', { name: 'Most played', exact: true }).click()

    await expect(page.getByText('(filtered)')).toBeVisible()
    await expect(await getVisibleGameTitles(page)).toEqual(['Dota 2', 'Alan Wake'])
  })

  test('sorts by highest metacritic score in grid view', async ({ page }) => {
    await setScanAllMock(page, createMockLibraryWithMetacritic())

    await page.click('button:has-text("Scan libraries")')
    await page.getByRole('button', { name: 'Highest rated', exact: true }).click()

    await expect(page.getByRole('button', { name: 'Highest rated', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(await getVisibleGameTitles(page)).toEqual([
      'Dota 2',
      'Cyberpunk 2077',
      'Alan Wake',
    ])
  })

  test('sorts by lowest metacritic score in grid view', async ({ page }) => {
    await setScanAllMock(page, createMockLibraryWithMetacritic())

    await page.click('button:has-text("Scan libraries")')
    await page.getByRole('button', { name: 'Lowest rated', exact: true }).click()

    await expect(await getVisibleGameTitles(page)).toEqual([
      'Alan Wake',
      'Cyberpunk 2077',
      'Dota 2',
    ])
  })
})
