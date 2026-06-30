/// <reference path="./global.d.ts" />

import { expect, goToAppPage, test } from './fixtures'

test.describe('settings', () => {
  test.beforeEach(async ({ page }) => {
    await goToAppPage(page, 'settings')
  })
  test.afterEach(async ({ page }) => {
    await page.evaluate(() =>
      window.settingsApi.update({ steamApiKey: '', githubPat: '', psnNpsso: '', psnOnlineId: '' }),
    )
  })

  test('shows settings layout with sub-navigation', async ({ page }) => {
    await expect(page.getByTestId('settings-section')).toBeVisible()
    await expect(page.getByTestId('settings-subnav')).toBeVisible()
    await expect(page.getByTestId('settings-nav-steam')).toBeVisible()
    await expect(page.getByTestId('settings-nav-github')).toBeVisible()
    await expect(page.getByTestId('settings-nav-psn')).toBeVisible()
    await expect(page.getByTestId('settings-page-steam')).toBeVisible()
    await expect(page.locator('#steam-api-key')).toBeVisible()
    await expect(page.getByLabel('Steam Web API key')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Save API key' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'steamcommunity.com/dev/apikey' })).toBeVisible()
  })

  test('navigates between settings sub-pages', async ({ page }) => {
    await page.getByTestId('settings-nav-github').click()
    await expect(page.getByTestId('settings-page-github')).toBeVisible()
    await expect(page.getByLabel('GitHub Personal Access Token')).toBeVisible()

    await page.getByTestId('settings-nav-psn').click()
    await expect(page.getByTestId('settings-page-psn')).toBeVisible()
    await expect(page.locator('#psn-npsso')).toBeVisible()
    await expect(page.getByLabel('PSN NPSSO token')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Save account settings' })).toBeVisible()
  })

  test('saving empty key without configured key shows message', async ({ page }) => {
    await page.evaluate(() =>
      window.settingsApi.update({ steamApiKey: '', githubPat: '', psnNpsso: '', psnOnlineId: '' }),
    )
    await page.reload()
    await page.waitForSelector('#steam-api-key')
    await page.getByRole('button', { name: 'Save API key' }).click()
    await expect(page.getByText('No changes to save.')).toBeVisible()
  })

  test('keeps existing key when saving empty form', async ({ page }) => {
    await page.fill('#steam-api-key', 'e2e-existing-key')
    await page.getByRole('button', { name: 'Save API key' }).click()
    await expect(page.getByText('Settings saved.')).toBeVisible()

    await page.getByRole('button', { name: 'Save API key' }).click()
    await expect(page.getByText('No changes to save.')).toBeVisible()

    const configured = await page.evaluate(() => window.settingsApi.get())
    expect(configured.steamApiKeySet).toBe(true)
  })

  test('saves and clears steam api key through UI', async ({ page }) => {
    await page.fill('#steam-api-key', 'e2e-test-steam-api-key')
    await page.getByRole('button', { name: 'Save API key' }).click()

    await expect(page.getByText('Settings saved.')).toBeVisible()
    await expect(page.getByText('Steam API key configured')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Clear key' })).toBeVisible()

    const configured = await page.evaluate(() => window.settingsApi.get())
    expect(configured.steamApiKeySet).toBe(true)

    await page.getByRole('button', { name: 'Clear key' }).click()
    await expect(page.getByText('Steam API key removed.')).toBeVisible()
    await expect(page.getByText('Steam API key configured')).toHaveCount(0)

    const cleared = await page.evaluate(() => window.settingsApi.get())
    expect(cleared.steamApiKeySet).toBe(false)
  })

  test('saves and clears psn npsso through UI', async ({ page }) => {
    await page.getByTestId('settings-nav-psn').click()
    await page.waitForSelector('#psn-npsso')

    await page.fill('#psn-npsso', 'e2e-test-psn-npsso')
    await page.getByRole('button', { name: 'Save account settings' }).click()

    await expect(page.getByText('Settings saved.')).toBeVisible()
    await expect(page.getByText('PSN NPSSO configured')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Clear token' })).toBeVisible()

    const configured = await page.evaluate(() => window.settingsApi.get())
    expect(configured.psnNpssoSet).toBe(true)

    await page.getByRole('button', { name: 'Clear token' }).click()
    await expect(page.getByText('PSN NPSSO token removed.')).toBeVisible()
    await expect(page.getByText('PSN NPSSO configured')).toHaveCount(0)

    const cleared = await page.evaluate(() => window.settingsApi.get())
    expect(cleared.psnNpssoSet).toBe(false)
  })

  test('persists psn online id through settings API', async ({ page }) => {
    await page.getByTestId('settings-nav-psn').click()
    await page.waitForSelector('#psn-online-id')

    await page.fill('#psn-online-id', 'public-player')
    await page.getByRole('button', { name: 'Save account settings' }).click()

    await expect(page.getByText('Settings saved.')).toBeVisible()

    const configured = await page.evaluate(() => window.settingsApi.get())
    expect(configured.psnOnlineId).toBe('public-player')
  })

  test('saves and clears github pat through UI', async ({ page }) => {
    await page.getByTestId('settings-nav-github').click()
    await page.waitForSelector('#github-pat')

    await page.fill('#github-pat', 'e2e-github-pat-token')
    await page.getByRole('button', { name: 'Zapisz token GitHub' }).click()

    await expect(page.getByText('Token GitHub zapisany.')).toBeVisible()
    await expect(page.getByText('Token GitHub skonfigurowany')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Usuń token' })).toBeVisible()

    const configured = await page.evaluate(() => window.settingsApi.get())
    expect(configured.githubPatSet).toBe(true)

    await page.getByRole('button', { name: 'Usuń token' }).click()
    await expect(page.getByText('Token GitHub usunięty.')).toBeVisible()
    await expect(page.getByText('Token GitHub skonfigurowany')).toHaveCount(0)

    const cleared = await page.evaluate(() => window.settingsApi.get())
    expect(cleared.githubPatSet).toBe(false)
  })
})
