import MCR from 'monocart-coverage-reports'
import type { Page } from '@playwright/test'

export const e2eCoverageEnabled = process.env.npm_lifecycle_event === 'test:e2e:coverage'

function isProjectSource(sourcePath: string): boolean {
  const normalized = sourcePath.replace(/\\/g, '/')
  if (normalized.includes('node_modules/')) {
    return false
  }

  return (
    normalized.startsWith('src/')
    || normalized.includes('/src/')
    || normalized.startsWith('shared/')
    || normalized.includes('/shared/')
    || normalized.startsWith('electron/')
    || normalized.includes('/electron/')
  )
}

function isAppBundle(entryUrl: string): boolean {
  const url = entryUrl.replace(/\\/g, '/')
  if (url.includes('node_modules/') || url.startsWith('node:')) {
    return false
  }

  return url.includes('/dist/') || url.startsWith('file:')
}

export async function startPageCoverage(page: Page): Promise<void> {
  await page.coverage.startJSCoverage({ resetOnNavigation: false })
}

export async function stopPageCoverageAndReport(page: Page): Promise<void> {
  const jsCoverage = await page.coverage.stopJSCoverage()
  const appCoverage = jsCoverage.filter((entry) => isAppBundle(entry.url))

  const mcr = MCR({
    name: 'E2E Coverage',
    outputDir: './coverage/e2e',
    reports: ['v8', 'lcov', 'json-summary', 'text-summary'],
    sourceFilter: isProjectSource,
  })

  await mcr.add(appCoverage)
  await mcr.generate()
}
