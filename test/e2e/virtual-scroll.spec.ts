/// <reference path="./global.d.ts" />

import { createLargeMockLibrary } from '../fixtures/games'
import { expect, setScanAllMock, test } from './fixtures'

const LARGE_LIBRARY_SIZE = 100

async function getVirtualScrollMetrics(
  page: import('@playwright/test').Page,
  testId: 'game-library-grid' | 'game-library-list',
) {
  return page.getByTestId(testId).evaluate((element) => ({
    scrollHeight: element.scrollHeight,
    clientHeight: element.clientHeight,
    renderedItems: element.querySelectorAll('li').length,
  }))
}

test.describe('virtual scroll', () => {
  const largeLibrary = createLargeMockLibrary(LARGE_LIBRARY_SIZE)

  test.beforeEach(async ({ page }) => {
    await page.reload()
    await page.waitForSelector('button:has-text("Scan libraries")')
    await setScanAllMock(page, null)
  })

  test.afterEach(async ({ page }) => {
    await setScanAllMock(page, null)
  })

  test('grid view keeps a scrollable container and renders a subset of games', async ({ page }) => {
    await setScanAllMock(page, largeLibrary)

    await page.click('button:has-text("Scan libraries")')
    await expect(
      page.getByText(new RegExp(`Last scan:.*— ${LARGE_LIBRARY_SIZE} games`)),
    ).toBeVisible()

    const grid = page.getByTestId('game-library-grid')
    await expect(grid.getByText('Game 0000')).toBeVisible()

    await expect
      .poll(async () => {
        const metrics = await getVirtualScrollMetrics(page, 'game-library-grid')
        return metrics.renderedItems
      })
      .toBeLessThan(LARGE_LIBRARY_SIZE)

    const metrics = await getVirtualScrollMetrics(page, 'game-library-grid')
    expect(metrics.clientHeight).toBeGreaterThan(0)
    expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight)
    expect(metrics.renderedItems).toBeGreaterThan(0)
  })

  test('grid view reveals the last game after scrolling to the bottom', async ({ page }) => {
    await setScanAllMock(page, largeLibrary)

    await page.click('button:has-text("Scan libraries")')
    const grid = page.getByTestId('game-library-grid')

    await expect(grid.getByText('Game 0000')).toBeVisible()
    await expect(
      grid.getByText(`Game ${String(LARGE_LIBRARY_SIZE - 1).padStart(4, '0')}`),
    ).toHaveCount(0)

    await grid.evaluate((element) => {
      element.scrollTop = element.scrollHeight
    })

    await expect(
      grid.getByText(`Game ${String(LARGE_LIBRARY_SIZE - 1).padStart(4, '0')}`),
    ).toBeVisible()
    await expect(grid.getByText('Game 0000')).toHaveCount(0)
  })

  test('list view keeps a scrollable container and renders a subset of games', async ({ page }) => {
    await setScanAllMock(page, largeLibrary)

    await page.click('button:has-text("Scan libraries")')
    await page.getByRole('button', { name: 'List view' }).click()

    await expect(
      page.getByText(new RegExp(`Last scan:.*— ${LARGE_LIBRARY_SIZE} games`)),
    ).toBeVisible()

    const list = page.getByTestId('game-library-list')
    await expect(list.getByText('Game 0000')).toBeVisible()

    await expect
      .poll(async () => {
        const metrics = await getVirtualScrollMetrics(page, 'game-library-list')
        return metrics.renderedItems
      })
      .toBeLessThan(LARGE_LIBRARY_SIZE)

    const metrics = await getVirtualScrollMetrics(page, 'game-library-list')
    expect(metrics.clientHeight).toBeGreaterThan(0)
    expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight)
    expect(metrics.renderedItems).toBeGreaterThan(0)
  })

  test('list view reveals the last game after scrolling to the bottom', async ({ page }) => {
    await setScanAllMock(page, largeLibrary)

    await page.click('button:has-text("Scan libraries")')
    await page.getByRole('button', { name: 'List view' }).click()

    const list = page.getByTestId('game-library-list')
    await expect(list.getByText('Game 0000')).toBeVisible()
    await expect(
      list.getByText(`Game ${String(LARGE_LIBRARY_SIZE - 1).padStart(4, '0')}`),
    ).toHaveCount(0)

    await list.evaluate((element) => {
      element.scrollTop = element.scrollHeight
    })

    await expect(
      list.getByText(`Game ${String(LARGE_LIBRARY_SIZE - 1).padStart(4, '0')}`),
    ).toBeVisible()
    await expect(list.getByText('Game 0000')).toHaveCount(0)
  })

  test('platform filter still virtualizes the filtered library', async ({ page }) => {
    await setScanAllMock(page, largeLibrary)

    await page.click('button:has-text("Scan libraries")')
    await page.getByRole('button', { name: 'Steam' }).click()

    await expect(
      page.getByText(new RegExp(`Last scan:.*— ${LARGE_LIBRARY_SIZE} games \\(filtered\\)`)),
    ).toBeVisible()

    const grid = page.getByTestId('game-library-grid')
    const metrics = await getVirtualScrollMetrics(page, 'game-library-grid')

    expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight)
    expect(metrics.renderedItems).toBeLessThan(LARGE_LIBRARY_SIZE)

    await grid.evaluate((element) => {
      element.scrollTop = element.scrollHeight
    })

    await expect(
      grid.getByText(`Game ${String(LARGE_LIBRARY_SIZE - 1).padStart(4, '0')}`),
    ).toBeVisible()
  })
})
