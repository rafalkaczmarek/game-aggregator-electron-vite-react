/// <reference path="./global.d.ts" />

import { expect, test } from './fixtures'

test.describe('settings', () => {
  test.afterEach(async ({ page }) => {
    await page.evaluate(() => window.settingsApi.update({ steamApiKey: '' }))
  })

  test('shows steam api key settings form', async ({ page }) => {
    await expect(page.getByText('Settings', { exact: true })).toBeVisible()
    await expect(page.locator('#steam-api-key')).toBeVisible()
    await expect(page.getByLabel('Steam Web API key')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Save settings' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'steamcommunity.com/dev/apikey' })).toBeVisible()
  })

  test('saving empty key without configured key shows message', async ({ page }) => {
    await page.evaluate(() => window.settingsApi.update({ steamApiKey: '' }))
    await page.reload()
    await page.waitForSelector('#steam-api-key')
    await page.getByRole('button', { name: 'Save settings' }).click()
    await expect(page.getByText('No API key provided.')).toBeVisible()
  })

  test('keeps existing key when saving empty form', async ({ page }) => {
    await page.fill('#steam-api-key', 'e2e-existing-key')
    await page.getByRole('button', { name: 'Save settings' }).click()
    await expect(page.getByText('Steam API key saved.')).toBeVisible()

    await page.getByRole('button', { name: 'Save settings' }).click()
    await expect(page.getByText('Existing API key kept unchanged.')).toBeVisible()

    const configured = await page.evaluate(() => window.settingsApi.get())
    expect(configured.steamApiKeySet).toBe(true)
  })

  test('saves and clears steam api key through UI', async ({ page }) => {
    await page.fill('#steam-api-key', 'e2e-test-steam-api-key')
    await page.getByRole('button', { name: 'Save settings' }).click()

    await expect(page.getByText('Steam API key saved.')).toBeVisible()
    await expect(page.getByText('API key configured')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Clear key' })).toBeVisible()

    const configured = await page.evaluate(() => window.settingsApi.get())
    expect(configured.steamApiKeySet).toBe(true)

    await page.getByRole('button', { name: 'Clear key' }).click()
    await expect(page.getByText('Steam API key removed.')).toBeVisible()
    await expect(page.getByText('API key configured')).toHaveCount(0)

    const cleared = await page.evaluate(() => window.settingsApi.get())
    expect(cleared.steamApiKeySet).toBe(false)
  })
})
