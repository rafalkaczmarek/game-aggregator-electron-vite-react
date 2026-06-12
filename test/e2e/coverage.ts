import { access, mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import MCR from 'monocart-coverage-reports'
import type { Page } from '@playwright/test'

const rootDir = path.resolve(import.meta.dirname, '..', '..')
const rootPrefix = rootDir.replace(/\\/g, '/')

export const e2eCoverageEnabled = process.env.E2E_COVERAGE === '1'
export const nodeCoverageDir = path.join(rootDir, 'coverage', 'e2e-node-v8')

const excludedRelativePaths = new Set([
  'electron/main/update.ts',
])

function toProjectRelativePath(sourcePath: string): string | null {
  const normalized = sourcePath.replace(/\\/g, '/')

  if (normalized.startsWith(rootPrefix + '/')) {
    return normalized.slice(rootPrefix.length + 1)
  }

  if (
    normalized.startsWith('src/')
    || normalized.startsWith('electron/')
    || normalized.startsWith('shared/')
  ) {
    return normalized
  }

  return null
}

function isProjectSource(sourcePath: string): boolean {
  const relative = toProjectRelativePath(sourcePath)
  if (!relative || relative.includes('node_modules/')) {
    return false
  }

  if (excludedRelativePaths.has(relative)) {
    return false
  }

  if (relative.startsWith('src/demos/') || relative.startsWith('src/components/update/')) {
    return false
  }

  return (
    relative.startsWith('src/')
    || relative.startsWith('electron/')
    || relative.startsWith('shared/')
  )
}

function isTrackedBundle(entryUrl: string): boolean {
  const url = entryUrl.replace(/\\/g, '/')
  if (url.includes('/node_modules/') || url.startsWith('node:')) {
    return false
  }

  return url.includes('/dist/') || url.includes('/dist-electron/') || url.startsWith('file:')
}

export async function prepareNodeCoverageDir(): Promise<void> {
  await rm(nodeCoverageDir, { recursive: true, force: true })
  await mkdir(nodeCoverageDir, { recursive: true })
}

export async function startPageCoverage(page: Page): Promise<void> {
  await page.coverage.startJSCoverage({ resetOnNavigation: false })
}

export type RendererCoverageEntry = Awaited<ReturnType<Page['coverage']['stopJSCoverage']>>[number]

export async function collectRendererCoverage(page: Page): Promise<RendererCoverageEntry[]> {
  const jsCoverage = await page.coverage.stopJSCoverage()
  return jsCoverage.filter((entry) => isTrackedBundle(entry.url))
}

async function dirExists(target: string): Promise<boolean> {
  try {
    await access(target)
    return true
  } catch {
    return false
  }
}

export async function generateE2eCoverageReport(
  rendererCoverage: RendererCoverageEntry[],
): Promise<void> {
  const mcr = MCR({
    name: 'E2E Coverage',
    outputDir: path.join(rootDir, 'coverage', 'e2e'),
    baseDir: rootDir,
    reports: ['v8', 'lcov', 'json-summary', 'text-summary'],
    entryFilter: (entry) => {
      const url = entry.url.replace(/\\/g, '/')
      if (url.includes('/node_modules/')) {
        return false
      }
      return isTrackedBundle(url)
    },
    sourceFilter: isProjectSource,
    filter: {
      '**/node_modules/**': false,
      '**/src/demos/**': false,
      '**/src/components/update/**': false,
      '**/electron/main/update.ts': false,
      [`${rootPrefix}/src/**`]: true,
      [`${rootPrefix}/electron/**`]: true,
      [`${rootPrefix}/shared/**`]: true,
      'src/**': true,
      'electron/**': true,
      'shared/**': true,
      '**/**': false,
    },
    clean: true,
  })

  if (rendererCoverage.length > 0) {
    await mcr.add(rendererCoverage)
  }

  if (await dirExists(nodeCoverageDir)) {
    await mcr.addFromDir(nodeCoverageDir)
  }

  await mcr.generate()
}
