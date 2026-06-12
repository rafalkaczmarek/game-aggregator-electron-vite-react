import path from 'node:path'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

function externalNodeSqlite(): Plugin {
  return {
    name: 'external-node-sqlite',
    enforce: 'pre',
    resolveId(id) {
      if (id === 'node:sqlite') return { id, external: true }
    },
  }
}

export default defineConfig({
  plugins: [externalNodeSqlite(), react()],
  resolve: {
    alias: {
      '@src': path.join(__dirname, 'src'),
      '@shared': path.join(__dirname, 'shared'),
    },
  },
  test: {
    root: __dirname,
    environment: 'jsdom',
    setupFiles: ['test/setup.ts'],
    include: ['test/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    exclude: ['test/e2e/**'],
    passWithNoTests: true,
    testTimeout: 1000 * 29,
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage/unit',
      reporter: ['text', 'text-summary', 'html', 'lcov', 'json-summary'],
      include: ['src/**/*.{ts,tsx}', 'electron/**/*.ts', 'shared/**/*.ts'],
      exclude: [
        'test/**',
        '**/*.d.ts',
        'dist/**',
        'dist-electron/**',
      ],
    },
  },
})
