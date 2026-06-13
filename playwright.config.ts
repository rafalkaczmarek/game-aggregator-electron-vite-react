import { defineConfig } from '@playwright/test'

if (process.env.E2E_COVERAGE === '1' || process.env.npm_lifecycle_event === 'test:e2e:coverage') {
  process.env.E2E_COVERAGE = '1'
}

export default defineConfig({
  testDir: './test/e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    trace: 'on-first-retry',
  },
})
