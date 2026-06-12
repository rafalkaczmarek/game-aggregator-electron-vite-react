/// <reference path="./global.d.ts" />

import path from 'node:path'
import { spawn, type ChildProcess } from 'node:child_process'
import {
  type ElectronApplication,
  type Page,
  type JSHandle,
  expect,
  test,
  _electron as electron,
} from '@playwright/test'
import type { BrowserWindow } from 'electron'
import type { AggregatedLibrary } from '@shared/types/game'
import { createMockLibrary } from '../fixtures/games'
import {
  e2eCoverageEnabled,
  startPageCoverage,
  stopPageCoverageAndReport,
} from './coverage'

const root = path.resolve(import.meta.dirname, '..', '..')
const e2eUserData = path.join(root, 'test', 'e2e-user-data')
let electronApp: ElectronApplication
let page: Page
let xvfbProcess: ChildProcess | undefined

function startXvfbOnLinux(): Promise<void> {
  if (process.platform !== 'linux' || process.env.DISPLAY) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    xvfbProcess = spawn('Xvfb', [':99', '-screen', '0', '1280x720x24', '-ac'], {
      stdio: 'ignore',
      detached: true,
    })

    xvfbProcess.once('error', reject)

    setTimeout(() => {
      process.env.DISPLAY = ':99'
      resolve()
    }, 500)
  })
}

test.beforeAll(async () => {
  test.setTimeout(30000)
  await startXvfbOnLinux()

  electronApp = await electron.launch({
    args: ['.', '--no-sandbox'],
    cwd: root,
    env: {
      ...process.env,
      NODE_ENV: 'development',
      E2E_TEST: '1',
      ELECTRON_USER_DATA: e2eUserData,
      STEAM_API_KEY: '',
    },
  })
  page = await electronApp.firstWindow()

  if (e2eCoverageEnabled) {
    await startPageCoverage(page)
  }

  const mainWin: JSHandle<BrowserWindow> = await electronApp.browserWindow(page)
  await mainWin.evaluate(async (win) => {
    win.webContents.executeJavaScript('console.log("Execute JavaScript with e2e testing.")')
  })
})

test.afterAll(async () => {
  if (page) {
    if (e2eCoverageEnabled) {
      await stopPageCoverageAndReport(page)
    }

    await page.screenshot({ path: 'test/screenshots/e2e.png' })
    await page.close()
  }

  if (electronApp) {
    await electronApp.close()
  }

  if (xvfbProcess?.pid) {
    process.kill(-xvfbProcess.pid)
    xvfbProcess = undefined
  }
})

test.describe('[game-aggregator] e2e tests', () => {
  test('startup', async () => {
    const title = await page.title()
    expect(title).toBe('Electron + Vite + React')
  })

  test('shows game aggregator home page', async () => {
    const h1 = await page.$('h1')
    const title = await h1?.textContent()
    expect(title).toBe('Wszystkie gry w jednym miejscu.')
  })

  test('scan libraries shows platform results', async () => {
    test.setTimeout(60000)

    await page.click('button:has-text("Scan libraries")')
    await page.waitForSelector('text=Last scan:')

    const platformRows = await page.locator('[data-testid="platform-summary"] li').all()
    expect(platformRows).toHaveLength(4)

    for (const platform of ['steam', 'gog', 'epic', 'psn']) {
      await expect(page.locator('[data-testid="platform-summary"] li', { hasText: platform })).toBeVisible()
    }

    const steamRow = page.locator('[data-testid="platform-summary"] li', { hasText: 'steam' })
    await expect(steamRow).not.toContainText('not implemented')
  })

  async function setScanAllMock(library: AggregatedLibrary | null) {
    await page.evaluate((data) => {
      window.__e2e.setScanAllMock(data)
    }, library)
  }

  async function writeLibraryCache(library: AggregatedLibrary) {
    await page.evaluate((data) => window.__e2e.writeLibraryCache(data), library)
  }

  async function clearLibraryCache() {
    await page.evaluate(() => window.__e2e.clearLibraryCache())
  }

  test.describe('game library views', () => {
    const mockLibrary = createMockLibrary()

    test.beforeEach(async () => {
      await page.reload()
      await page.waitForSelector('button:has-text("Scan libraries")')
      await setScanAllMock(null)
    })

    test.afterEach(async () => {
      await setScanAllMock(null)
    })

    test('shows games in grid view by default after scan', async () => {
      await setScanAllMock(mockLibrary)

      await page.click('button:has-text("Scan libraries")')
      await expect(page.getByText('Your games')).toBeVisible()
      await expect(page.getByTestId('game-library-grid')).toBeVisible()
      await expect(page.getByText('Alan Wake')).toBeVisible()
      await expect(page.getByText('Cyberpunk 2077')).toBeVisible()
      await expect(page.getByText('Dota 2')).toBeVisible()
      await expect(page.getByText('— 3 games')).toBeVisible()
    })

    test('switches between grid and list views', async () => {
      await setScanAllMock(mockLibrary)

      await page.click('button:has-text("Scan libraries")')
      await expect(page.getByTestId('game-library-grid')).toBeVisible()

      await page.getByRole('button', { name: 'List view' }).click()
      await expect(page.getByTestId('game-library-list')).toBeVisible()
      await expect(page.getByTestId('game-library-grid')).toHaveCount(0)

      await page.getByRole('button', { name: 'Grid view' }).click()
      await expect(page.getByTestId('game-library-grid')).toBeVisible()
      await expect(page.getByTestId('game-library-list')).toHaveCount(0)
    })

    test('shows empty state when scan returns no games', async () => {
      await setScanAllMock(createMockLibrary([]))

      await page.click('button:has-text("Scan libraries")')
      await expect(page.getByText(/No games found/i)).toBeVisible()
      await expect(page.getByRole('button', { name: 'List view' })).toHaveCount(0)
      await expect(page.locator('[data-testid="platform-summary"] li')).toHaveCount(4)
    })
  })

  test.describe('library cache', () => {
    test.beforeEach(async () => {
      await clearLibraryCache()
      await setScanAllMock(null)
      await page.reload()
      await page.waitForSelector('button:has-text("Scan libraries")')
    })

    test.afterEach(async () => {
      await clearLibraryCache()
      await setScanAllMock(null)
    })

    test('shows no library until first scan when cache is missing', async () => {
      await expect(page.getByText('Last scan:')).toHaveCount(0)
      await expect(page.getByText('Your games')).toHaveCount(0)
    })

    test('loads cached library on startup without scanning', async () => {
      const mockLibrary = createMockLibrary()
      await writeLibraryCache(mockLibrary)

      await page.reload()
      await page.waitForSelector('button:has-text("Scan libraries")')

      await expect(page.getByText('Your games')).toBeVisible()
      await expect(page.getByTestId('game-library-grid')).toBeVisible()
      await expect(page.getByText('Alan Wake')).toBeVisible()
      await expect(page.getByText('Cyberpunk 2077')).toBeVisible()
      await expect(page.getByText('Dota 2')).toBeVisible()
      await expect(page.getByText('— 3 games')).toBeVisible()
      await expect(page.locator('[data-testid="platform-summary"] li')).toHaveCount(4)
    })

    test('getLibrary returns cached library via IPC', async () => {
      const mockLibrary = createMockLibrary()
      await writeLibraryCache(mockLibrary)

      const cached = await page.evaluate(() => window.gameApi.getLibrary())

      expect(cached).not.toBeNull()
      expect(cached?.scannedAt).toBe(mockLibrary.scannedAt)
      expect(cached?.games).toHaveLength(3)
      expect(cached?.results).toHaveLength(4)
    })

    test('persists library after scan and restores it on reload', async () => {
      test.setTimeout(60000)

      await page.click('button:has-text("Scan libraries")')
      await page.waitForSelector('text=Last scan:')

      const cached = await page.evaluate(() => window.gameApi.getLibrary())
      expect(cached).not.toBeNull()
      expect(Array.isArray(cached?.games)).toBe(true)
      expect(typeof cached?.scannedAt).toBe('string')
      expect(cached?.results).toHaveLength(4)

      await page.reload()
      await page.waitForSelector('text=Last scan:')

      const restored = await page.evaluate(() => window.gameApi.getLibrary())
      expect(restored).not.toBeNull()
      expect(restored?.scannedAt).toBe(cached?.scannedAt)
      expect(restored?.games.length).toBe(cached?.games.length)
      await expect(page.locator('[data-testid="platform-summary"] li')).toHaveCount(4)
    })
  })

  test('steam platform scan returns a result via IPC', async () => {
    test.setTimeout(60000)

    const result = await page.evaluate(() => window.gameApi.scanPlatform('steam'))

    expect(result.platform).toBe('steam')
    expect(Array.isArray(result.games)).toBe(true)
    expect(Array.isArray(result.errors)).toBe(true)
    expect(result.errors.some((error) => error.includes('not implemented'))).toBe(false)
  })

  test.describe('settings', () => {
    test.afterEach(async () => {
      await page.evaluate(() => window.settingsApi.update({ steamApiKey: '' }))
    })

    test('shows steam api key settings form', async () => {
      await expect(page.getByText('Settings', { exact: true })).toBeVisible()
      await expect(page.locator('#steam-api-key')).toBeVisible()
      await expect(page.getByLabel('Steam Web API key')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Save settings' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'steamcommunity.com/dev/apikey' })).toBeVisible()
    })

    test('saving empty key without configured key shows message', async () => {
      await page.evaluate(() => window.settingsApi.update({ steamApiKey: '' }))
      await page.reload()
      await page.waitForSelector('#steam-api-key')
      await page.getByRole('button', { name: 'Save settings' }).click()
      await expect(page.getByText('No API key provided.')).toBeVisible()
    })

    test('saves and clears steam api key through UI', async () => {
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
})
