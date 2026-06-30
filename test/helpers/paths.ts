import path from 'node:path'

/** Absolute path to the `test/` directory. */
export const TEST_ROOT = path.resolve(import.meta.dirname, '..')

/** Absolute path to `test/fixtures/`. */
export const FIXTURES_DIR = path.join(TEST_ROOT, 'fixtures')

/** Resolves a path under `test/fixtures/`. */
export function fixturePath(...segments: string[]) {
  return path.join(FIXTURES_DIR, ...segments)
}

/** Resolves a writable temp directory under `test/.tmp/` (gitignored). */
export function testTmpDir(name: string) {
  return path.join(TEST_ROOT, '.tmp', name)
}
