/// <reference path="./global.d.ts" />

import { expect, goToAppPage, test } from './fixtures'

test.describe('startup', () => {
  test('shows correct window title', async ({ page }) => {
    const title = await page.title()
    expect(title).toBe('Electron + Vite + React')
  })

  test('shows game aggregator home page', async ({ page }) => {
    await goToAppPage(page, 'home')
    await expect(page.getByTestId('home-page')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Wszystkie gry w jednym miejscu.' })).toBeVisible()
  })

  test('scan libraries shows platform results', async ({ page }) => {
    test.setTimeout(60_000)

    await goToAppPage(page, 'library')
    await page.click('button:has-text("Scan libraries")')
    await page.waitForSelector('text=Last scan:')

    const platformRows = await page.locator('[data-testid="platform-summary"] li').all()
    expect(platformRows).toHaveLength(4)

    for (const platform of ['steam', 'gog', 'epic', 'psn']) {
      await expect(
        page.locator('[data-testid="platform-summary"] li', { hasText: platform }),
      ).toBeVisible()
    }

    const steamRow = page.locator('[data-testid="platform-summary"] li', { hasText: 'steam' })
    await expect(steamRow).not.toContainText('not implemented')

    const psnRow = page.locator('[data-testid="platform-summary"] li', { hasText: 'psn' })
    await expect(psnRow).not.toContainText('not implemented')
  })
})
