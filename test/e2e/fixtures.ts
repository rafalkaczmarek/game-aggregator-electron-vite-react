/// <reference path="./global.d.ts" />

import path from 'node:path'
import { spawn, type ChildProcess } from 'node:child_process'
import {
  type ElectronApplication,
  type Page,
  type JSHandle,
  test as base,
  expect,
  _electron as electron,
} from '@playwright/test'
import type { BrowserWindow } from 'electron'
import type { AggregatedLibrary } from '@shared/types/game'
import {
  collectRendererCoverage,
  e2eCoverageEnabled,
  generateE2eCoverageReport,
  nodeCoverageDir,
  prepareNodeCoverageDir,
  startPageCoverage,
} from './coverage'

export { expect }

export const root = path.resolve(import.meta.dirname, '..', '..')
const e2eUserData = path.join(root, 'test', 'e2e-user-data')

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

type ElectronWorker = {
  electronApp: ElectronApplication
  page: Page
}

export const test = base.extend<{}, { electronWorker: ElectronWorker }>({
  electronWorker: [
    async ({}, use) => {
      await startXvfbOnLinux()

      if (e2eCoverageEnabled) {
        await prepareNodeCoverageDir()
      }

      const electronApp = await electron.launch({
        args: ['.', '--no-sandbox'],
        cwd: root,
        env: {
          ...process.env,
          NODE_ENV: 'development',
          E2E_TEST: '1',
          ELECTRON_USER_DATA: e2eUserData,
          STEAM_API_KEY: '',
          ...(e2eCoverageEnabled ? { NODE_V8_COVERAGE: nodeCoverageDir } : {}),
        },
      })
      const page = await electronApp.firstWindow()

      if (e2eCoverageEnabled) {
        await startPageCoverage(page)
      }

      const mainWin: JSHandle<BrowserWindow> = await electronApp.browserWindow(page)
      await mainWin.evaluate(async (win) => {
        win.webContents.executeJavaScript('console.log("Execute JavaScript with e2e testing.")')
      })

      await use({ electronApp, page })

      if (e2eCoverageEnabled) {
        const rendererCoverage = await collectRendererCoverage(page)
        await page.screenshot({ path: 'test/screenshots/e2e.png' })
        await page.close()
        await electronApp.close()
        await generateE2eCoverageReport(rendererCoverage)
      } else {
        await page.screenshot({ path: 'test/screenshots/e2e.png' })
        await page.close()
        await electronApp.close()
      }

      if (xvfbProcess?.pid) {
        process.kill(-xvfbProcess.pid)
        xvfbProcess = undefined
      }
    },
    { scope: 'worker', timeout: 30_000 },
  ],

  page: async ({ electronWorker }, use) => {
    await use(electronWorker.page)
  },
})

export async function setScanAllMock(page: Page, library: AggregatedLibrary | null) {
  await page.evaluate((data) => {
    window.__e2e.setScanAllMock(data)
  }, library)
}

export async function writeLibraryCache(page: Page, library: AggregatedLibrary) {
  await page.evaluate((data) => window.__e2e.writeLibraryCache(data), library)
}

export async function clearLibraryCache(page: Page) {
  await page.evaluate(() => window.__e2e.clearLibraryCache())
}

export async function setGogGalaxyDb(page: Page, dbPath: string | null) {
  await page.evaluate((target) => window.__e2e.setGogGalaxyDbPath(target), dbPath)
}
