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

  const mainWin: JSHandle<BrowserWindow> = await electronApp.browserWindow(page)
  await mainWin.evaluate(async (win) => {
    win.webContents.executeJavaScript('console.log("Execute JavaScript with e2e testing.")')
  })
})

test.afterAll(async () => {
  if (page) {
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

    const platformRows = await page.$$('ul li')
    expect(platformRows).toHaveLength(4)

    for (const platform of ['steam', 'gog', 'epic', 'psn']) {
      await expect(page.locator('li', { hasText: platform })).toBeVisible()
    }

    const steamRow = page.locator('li', { hasText: 'steam' })
    await expect(steamRow).not.toContainText('not implemented')
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
