/// <reference path="./global.d.ts" />

import { createMockLibrary } from '../fixtures/games'
import {
  clearLibraryCache,
  configureGithubPat,
  expect,
  setRecommendationsMock,
  test,
  writeLibraryCache,
} from './fixtures'

const mockRecommendations = {
  owned: [
    {
      title: 'Cyberpunk 2077',
      reason: 'Masz ją w katalogu — warto wreszcie odpalić.',
      source: 'owned' as const,
      platform: 'gog' as const,
    },
  ],
  discover: [
    {
      title: 'Hades',
      reason: 'Dynamiczna rozgrywka jak w ulubionych akcjowych tytułach.',
      source: 'discover' as const,
    },
  ],
  errors: ['Uwaga e2e'],
  basedOnPlayedCount: 2,
}

test.describe('recommendations', () => {
  test.beforeEach(async ({ page }) => {
    await clearLibraryCache(page)
    await setRecommendationsMock(page, null)
    await page.evaluate(() =>
      window.settingsApi.update({ steamApiKey: '', githubPat: '', psnNpsso: '', psnOnlineId: '' }),
    )
    await page.reload()
    await page.waitForSelector('[data-testid="recommendations-section"]')
  })

  test.afterEach(async ({ page }) => {
    await setRecommendationsMock(page, null)
    await page.evaluate(() =>
      window.settingsApi.update({ steamApiKey: '', githubPat: '', psnNpsso: '', psnOnlineId: '' }),
    )
  })

  test('shows github pat warning and disables generate button without token', async ({ page }) => {
    await expect(page.getByTestId('generate-recommendations')).toBeDisabled()
    await expect(page.getByText(/Dodaj token GitHub PAT/i)).toBeVisible()
  })

  test('shows recommendations section and github models settings', async ({ page }) => {
    await expect(page.getByTestId('recommendations-section')).toBeVisible()
    await expect(page.getByText('Rekomendacje', { exact: true })).toBeVisible()
    await expect(page.getByLabel('GitHub Personal Access Token')).toBeVisible()
    await expect(page.getByRole('link', { name: 'gpt-4.1-mini' })).toBeVisible()
  })

  test('generates and displays mocked recommendations', async ({ page }) => {
    await writeLibraryCache(page, createMockLibrary())
    await configureGithubPat(page)
    await page.reload()
    await page.waitForSelector('[data-testid="generate-recommendations"]')
    await setRecommendationsMock(page, mockRecommendations)

    await expect(page.getByTestId('generate-recommendations')).toBeEnabled()
    await page.getByTestId('generate-recommendations').click()

    await expect(page.getByText('Z Twojego katalogu')).toBeVisible()
    await expect(page.getByText('Do odkrycia')).toBeVisible()
    await expect(page.getByTestId('recommendations-section').getByText('Cyberpunk 2077')).toBeVisible()
    await expect(page.getByTestId('recommendations-section').getByText('Hades')).toBeVisible()
    await expect(page.getByText('Profil oparty na 2 grach z czasem gry.')).toBeVisible()
    await expect(page.getByText('Uwaga e2e')).toBeVisible()
    await expect(page.getByTestId('recommendations-section').getByText('GOG')).toBeVisible()
  })

  test('shows empty recommendation message when mock returns no picks', async ({ page }) => {
    await writeLibraryCache(page, createMockLibrary())
    await configureGithubPat(page)
    await page.reload()
    await page.waitForSelector('[data-testid="generate-recommendations"]')
    await setRecommendationsMock(page, {
      owned: [],
      discover: [],
      errors: [],
      basedOnPlayedCount: 0,
    })
    await page.getByTestId('generate-recommendations').click()

    await expect(page.getByText(/Najpierw zeskanuj bibliotekę/i)).toBeVisible()
  })

  test('shows message when library cache is missing', async ({ page }) => {
    await configureGithubPat(page)
    await page.reload()
    await page.getByTestId('generate-recommendations').click()

    await expect(page.getByText(/Brak zeskanowanej biblioteki/i)).toBeVisible()
  })

  test('saves github pat and enables recommendations button', async ({ page }) => {
    await page.fill('#github-pat', 'e2e-github-pat-token')
    await page.getByRole('button', { name: 'Zapisz token GitHub' }).click()

    await expect(page.getByText('Token GitHub zapisany.')).toBeVisible()
    await expect(page.getByText('Token GitHub skonfigurowany')).toBeVisible()

    await page.reload()
    await page.waitForSelector('[data-testid="recommendations-section"]')
    await expect(page.getByTestId('generate-recommendations')).toBeEnabled()
    await expect(page.getByText(/Dodaj token GitHub PAT/i)).toHaveCount(0)

    const configured = await page.evaluate(() => window.settingsApi.get())
    expect(configured.githubPatSet).toBe(true)
  })
})
