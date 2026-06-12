/// <reference path="./global.d.ts" />

import { expect, test } from './fixtures'

test.describe('platform scan', () => {
  test('steam platform scan returns a result via IPC', async ({ page }) => {
    test.setTimeout(60_000)

    const result = await page.evaluate(() => window.gameApi.scanPlatform('steam'))

    expect(result.platform).toBe('steam')
    expect(Array.isArray(result.games)).toBe(true)
    expect(Array.isArray(result.errors)).toBe(true)
    expect(result.errors.some((error) => error.includes('not implemented'))).toBe(false)
  })

  test('rejects unknown platform via IPC', async ({ page }) => {
    const error = await page.evaluate(async () => {
      try {
        await window.gameApi.scanPlatform('xbox' as 'steam')
        return null
      } catch (caught) {
        return caught instanceof Error ? caught.message : String(caught)
      }
    })

    expect(error).toContain('Unknown platform')
  })
})
