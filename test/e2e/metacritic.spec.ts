/// <reference path="./global.d.ts" />

import {
  createMetacriticDuplicateTitleLibrary,
  createMetacriticCachePayload,
  createMockLibrary,
  createMockLibraryWithMetacritic,
  withMetacriticRatings,
} from '@test/fixtures/games'
import {
  clearLibraryCache,
  clearMetacriticCache,
  expect,
  getMetacriticApiCallCount,
  goToAppPage,
  setEnrichMetacriticFromCacheMode,
  setEnrichMetacriticMock,
  setScanAllMock,
  test,
  writeLibraryCache,
  writeMetacriticCache,
} from './fixtures'

test.describe('metacritic ratings', () => {
  test.beforeEach(async ({ page }) => {
    await clearLibraryCache(page)
    await setScanAllMock(page, null)
    await setEnrichMetacriticMock(page, null)
    await page.reload()
    await goToAppPage(page, 'library')
  })

  test.afterEach(async ({ page }) => {
    await setScanAllMock(page, null)
    await setEnrichMetacriticMock(page, null)
    await setEnrichMetacriticFromCacheMode(page, false)
    await clearMetacriticCache(page)
  })

  test('displays metacritic badges in grid view', async ({ page }) => {
    await writeLibraryCache(page, createMockLibraryWithMetacritic())
    await page.reload()
    await goToAppPage(page, 'library')

    const grid = page.getByTestId('game-library-grid')
    await expect(grid).toBeVisible()

    const dotaCard = grid.locator('article', { hasText: 'Dota 2' })
    await expect(dotaCard.getByLabel('Metascore: 90')).toBeVisible()
    await expect(dotaCard.getByLabel('User score: 6.8')).toBeVisible()

    const cyberpunkCard = grid.locator('article', { hasText: 'Cyberpunk 2077' })
    await expect(cyberpunkCard.getByLabel('Metascore: 86')).toBeVisible()
    await expect(cyberpunkCard.getByLabel('User score: 7.2')).toBeVisible()

    const alanWakeCard = grid.locator('article', { hasText: 'Alan Wake' })
    await expect(alanWakeCard.getByLabel('Metascore: 83')).toBeVisible()
    await expect(alanWakeCard.getByLabel('User score: 8.9')).toBeVisible()
  })

  test('displays metacritic badges in list view', async ({ page }) => {
    await writeLibraryCache(page, createMockLibraryWithMetacritic())
    await page.reload()
    await goToAppPage(page, 'library')

    await page.getByRole('button', { name: 'List view' }).click()
    const list = page.getByTestId('game-library-list')
    await expect(list).toBeVisible()

    const dotaRow = list.locator('li', { hasText: 'Dota 2' })
    await expect(dotaRow.getByLabel('Metascore: 90')).toBeVisible()
    await expect(dotaRow.getByLabel('User score: 6.8')).toBeVisible()
  })

  test('shows best metascore when duplicate titles are grouped', async ({ page }) => {
    await writeLibraryCache(page, createMetacriticDuplicateTitleLibrary())
    await page.reload()
    await goToAppPage(page, 'library')

    const grid = page.getByTestId('game-library-grid')
    const plagueCard = grid.locator('article', { hasText: 'A Plague Tale: Innocence' })
    await expect(plagueCard.getByLabel('Metascore: 92')).toBeVisible()
    await expect(plagueCard.getByLabel('User score: 8.1')).toBeVisible()
    await expect(plagueCard.getByLabel('Metascore: 78')).toHaveCount(0)
  })

  test('disables load metacritic button when library is empty', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Load Metacritic scores' })).toBeDisabled()
  })

  test('enables load metacritic button after scan', async ({ page }) => {
    await setScanAllMock(page, createMockLibrary())
    await page.click('button:has-text("Scan libraries")')
    await expect(page.getByText('Your games')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Load Metacritic scores' })).toBeEnabled()
  })

  test('shows failure when metacritic enrichment is unavailable', async ({ page }) => {
    await setScanAllMock(page, createMockLibrary())
    await page.click('button:has-text("Scan libraries")')
    await expect(page.getByText('Your games')).toBeVisible()

    await page.getByRole('button', { name: 'Load Metacritic scores' }).click()

    const status = page.getByTestId('metacritic-enrichment-status')
    await expect(status).toBeVisible()
    await expect(status.getByText(/Metacritic scores could not be loaded/i)).toBeVisible()

    await status.getByRole('button', { name: 'Dismiss' }).click()
    await expect(status).toHaveCount(0)
  })

  test('shows metacritic badges incrementally during mock enrichment', async ({ page }) => {
    const baseLibrary = createMockLibrary()
    const enrichedLibrary = withMetacriticRatings(baseLibrary)

    await writeLibraryCache(page, baseLibrary)
    await page.reload()
    await goToAppPage(page, 'library')
    await setEnrichMetacriticMock(page, enrichedLibrary)

    const grid = page.getByTestId('game-library-grid')
    await expect(grid.locator('[aria-label^="Metascore:"]')).toHaveCount(0)

    await page.getByRole('button', { name: 'Load Metacritic scores' }).click()

    const status = page.getByTestId('metacritic-enrichment-status')
    await expect(status.getByText(/Fetching Metacritic scores/i)).toBeVisible()

    await expect
      .poll(async () => grid.locator('[aria-label^="Metascore:"]').count(), { timeout: 5_000 })
      .toBeGreaterThan(0)

    const midCount = await grid.locator('[aria-label^="Metascore:"]').count()
    expect(midCount).toBeGreaterThan(0)
    expect(midCount).toBeLessThan(3)

    await expect(status.getByText(/Metacritic scores updated — 3 games rated/i)).toBeVisible()
    await expect(grid.locator('[aria-label^="Metascore:"]')).toHaveCount(3)
  })

  test('shows metacritic badges incrementally in list view during mock enrichment', async ({ page }) => {
    const baseLibrary = createMockLibrary()
    const enrichedLibrary = withMetacriticRatings(baseLibrary)

    await writeLibraryCache(page, baseLibrary)
    await page.reload()
    await goToAppPage(page, 'library')
    await setEnrichMetacriticMock(page, enrichedLibrary)

    await page.getByRole('button', { name: 'List view' }).click()
    const list = page.getByTestId('game-library-list')
    await expect(list.locator('[aria-label^="Metascore:"]')).toHaveCount(0)

    await page.getByRole('button', { name: 'Load Metacritic scores' }).click()

    const status = page.getByTestId('metacritic-enrichment-status')
    await expect(status.getByText(/Fetching Metacritic scores/i)).toBeVisible()

    await expect
      .poll(async () => list.locator('[aria-label^="Metascore:"]').count(), { timeout: 5_000 })
      .toBeGreaterThan(0)

    const midCount = await list.locator('[aria-label^="Metascore:"]').count()
    expect(midCount).toBeGreaterThan(0)
    expect(midCount).toBeLessThan(3)

    await expect(status.getByText(/Metacritic scores updated — 3 games rated/i)).toBeVisible()
    await expect(list.locator('[aria-label^="Metascore:"]')).toHaveCount(3)
  })

  test('loads metacritic scores via mock enrichment', async ({ page }) => {
    const baseLibrary = createMockLibrary()
    const enrichedLibrary = withMetacriticRatings(baseLibrary)

    await writeLibraryCache(page, baseLibrary)
    await page.reload()
    await goToAppPage(page, 'library')
    await setEnrichMetacriticMock(page, enrichedLibrary)

    const grid = page.getByTestId('game-library-grid')
    await expect(grid.locator('[aria-label^="Metascore:"]')).toHaveCount(0)

    await page.getByRole('button', { name: 'Load Metacritic scores' }).click()

    const status = page.getByTestId('metacritic-enrichment-status')
    await expect(status.getByText(/Metacritic scores updated — 3 games rated/i)).toBeVisible()

    const dotaCard = grid.locator('article', { hasText: 'Dota 2' })
    await expect(dotaCard.getByLabel('Metascore: 90')).toBeVisible()
    await expect(dotaCard.getByLabel('User score: 6.8')).toBeVisible()

    await status.getByRole('button', { name: 'Dismiss' }).click()
    await expect(status).toHaveCount(0)
  })
})

test.describe('metacritic cache enrichment', () => {
  test.beforeEach(async ({ page }) => {
    await clearLibraryCache(page)
    await clearMetacriticCache(page)
    await setScanAllMock(page, null)
    await setEnrichMetacriticMock(page, null)
    await setEnrichMetacriticFromCacheMode(page, true)
    await page.reload()
    await goToAppPage(page, 'library')
  })

  test.afterEach(async ({ page }) => {
    await setScanAllMock(page, null)
    await setEnrichMetacriticMock(page, null)
    await setEnrichMetacriticFromCacheMode(page, false)
    await clearMetacriticCache(page)
  })

  test('loads metacritic scores from disk cache without calling the api', async ({ page }) => {
    const baseLibrary = createMockLibrary()
    await writeLibraryCache(page, baseLibrary)
    await writeMetacriticCache(page, createMetacriticCachePayload(baseLibrary))
    await page.reload()
    await goToAppPage(page, 'library')
    await setEnrichMetacriticFromCacheMode(page, true)

    const grid = page.getByTestId('game-library-grid')
    await expect(grid.locator('[aria-label^="Metascore:"]')).toHaveCount(0)

    await page.getByRole('button', { name: 'Load Metacritic scores' }).click()

    const status = page.getByTestId('metacritic-enrichment-status')
    await expect(status.getByText(/Metacritic scores updated — 3 games rated/i)).toBeVisible({
      timeout: 10_000,
    })

    const dotaCard = grid.locator('article', { hasText: 'Dota 2' })
    await expect(dotaCard.getByLabel('Metascore: 90')).toBeVisible()
    await expect(dotaCard.getByLabel('User score: 6.8')).toBeVisible()

    await expect.poll(() => getMetacriticApiCallCount(page)).toBe(0)
  })

  test('reuses existing library ratings without calling the api', async ({ page }) => {
    await writeLibraryCache(page, createMockLibraryWithMetacritic())
    await page.reload()
    await goToAppPage(page, 'library')
    await setEnrichMetacriticFromCacheMode(page, true)

    const grid = page.getByTestId('game-library-grid')
    await expect(grid.locator('[aria-label^="Metascore:"]')).toHaveCount(3)

    await page.getByRole('button', { name: 'Load Metacritic scores' }).click()

    const status = page.getByTestId('metacritic-enrichment-status')
    await expect(status.getByText(/Metacritic scores updated — 3 games rated/i)).toBeVisible({
      timeout: 10_000,
    })

    await expect.poll(() => getMetacriticApiCallCount(page)).toBe(0)
  })
})
