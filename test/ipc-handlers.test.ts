import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AggregatedLibrary, GamePlatform } from '@shared/types/game'
import { createMockLibrary } from './fixtures/games'

const handlers = new Map<string, (...args: unknown[]) => unknown>()

const scanAllGames = vi.fn<() => Promise<AggregatedLibrary>>()
const scanPlatform = vi.fn<(platform: GamePlatform) => Promise<unknown>>()
const readCachedLibrary = vi.fn<() => Promise<AggregatedLibrary | null>>()
const writeCachedLibrary = vi.fn<(library: AggregatedLibrary) => Promise<void>>()
const clearCachedLibrary = vi.fn<() => Promise<void>>()
const setE2eGalaxyDbPath = vi.fn<(dbPath: string | null) => void>()
const setE2ePsnFixture = vi.fn<(fixture: unknown) => void>()
const getSettingsState = vi.fn<() => Promise<unknown>>()
const updateSteamApiKey = vi.fn<(value: string | undefined) => Promise<void>>()
const updateGithubPat = vi.fn<(value: string | undefined) => Promise<void>>()
const getGithubPat = vi.fn<() => Promise<string | undefined>>()
const updatePsnNpsso = vi.fn<(value: string | undefined) => Promise<void>>()
const updatePsnOnlineId = vi.fn<(value: string | undefined) => Promise<void>>()

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
      handlers.set(channel, handler)
    }),
  },
}))

vi.mock('../electron/scanners', () => ({
  scanAllGames,
  scanPlatform,
}))

vi.mock('../electron/main/library/store', () => ({
  readCachedLibrary,
  writeCachedLibrary,
  clearCachedLibrary,
}))

vi.mock('../electron/scanners/gog/paths', () => ({
  setE2eGalaxyDbPath,
}))

vi.mock('../electron/scanners/psn/e2e', () => ({
  setE2ePsnFixture,
}))

vi.mock('../electron/main/settings/store', () => ({
  getSettingsState,
  updateSteamApiKey,
  updateGithubPat,
  getGithubPat,
  updatePsnNpsso,
  updatePsnOnlineId,
}))

const { registerGameIpcHandlers } = await import('../electron/main/ipc/games')
const { registerSettingsIpcHandlers } = await import('../electron/main/ipc/settings')

describe('ipc handlers', () => {
  beforeEach(() => {
    handlers.clear()
    scanAllGames.mockReset()
    scanPlatform.mockReset()
    readCachedLibrary.mockReset()
    writeCachedLibrary.mockReset()
    clearCachedLibrary.mockReset()
    setE2eGalaxyDbPath.mockReset()
    setE2ePsnFixture.mockReset()
    getSettingsState.mockReset()
    updateSteamApiKey.mockReset()
    updateGithubPat.mockReset()
    getGithubPat.mockReset()
    updatePsnNpsso.mockReset()
    updatePsnOnlineId.mockReset()

    registerGameIpcHandlers()
    registerSettingsIpcHandlers()
  })

  it('returns cached library', async () => {
    const library = createMockLibrary()
    readCachedLibrary.mockResolvedValue(library)

    await expect(handlers.get('games:get-library')!()).resolves.toEqual(library)
  })

  it('scans all platforms and writes cache', async () => {
    const library = createMockLibrary()
    scanAllGames.mockResolvedValue(library)

    await expect(handlers.get('games:scan-all')!()).resolves.toEqual(library)
    expect(writeCachedLibrary).toHaveBeenCalledWith(library)
  })

  it('delegates platform scan and rejects unknown platforms', async () => {
    scanPlatform.mockResolvedValue({ platform: 'steam', games: [], errors: [] })

    await expect(handlers.get('games:scan-platform')!(null, 'steam')).resolves.toMatchObject({
      platform: 'steam',
    })
    expect(scanPlatform).toHaveBeenCalledWith('steam')

    expect(() => handlers.get('games:scan-platform')!(null, 'unknown')).toThrow(
      'Unknown platform: unknown',
    )
  })

  it('returns settings state', async () => {
    getSettingsState.mockResolvedValue({
      steamApiKeySet: false,
      githubPatSet: false,
      psnNpssoSet: false,
    })

    await expect(handlers.get('settings:get')!()).resolves.toEqual({
      steamApiKeySet: false,
      githubPatSet: false,
      psnNpssoSet: false,
    })
  })

  it('applies settings updates and returns fresh state', async () => {
    getSettingsState.mockResolvedValue({
      steamApiKeySet: true,
      githubPatSet: true,
      psnNpssoSet: true,
      psnOnlineId: 'player',
    })

    await expect(
      handlers.get('settings:update')!(null, {
        steamApiKey: 'key',
        githubPat: 'ghp_test',
        psnNpsso: 'npsso',
        psnOnlineId: 'player',
      }),
    ).resolves.toEqual({
      steamApiKeySet: true,
      githubPatSet: true,
      psnNpssoSet: true,
      psnOnlineId: 'player',
    })

    expect(updateSteamApiKey).toHaveBeenCalledWith('key')
    expect(updateGithubPat).toHaveBeenCalledWith('ghp_test')
    expect(updatePsnNpsso).toHaveBeenCalledWith('npsso')
    expect(updatePsnOnlineId).toHaveBeenCalledWith('player')
  })
})

describe('e2e ipc handlers', () => {
  beforeEach(() => {
    handlers.clear()
    vi.unstubAllEnvs()
    registerGameIpcHandlers()
  })

  it('registers e2e helpers when E2E_TEST is enabled', async () => {
    vi.stubEnv('E2E_TEST', '1')
    handlers.clear()
    registerGameIpcHandlers()

    const library = createMockLibrary()
    await handlers.get('e2e:write-library-cache')!(null, library)
    expect(writeCachedLibrary).toHaveBeenCalledWith(library)

    await handlers.get('e2e:clear-library-cache')!()
    expect(clearCachedLibrary).toHaveBeenCalled()

    await handlers.get('e2e:set-gog-galaxy-db')!(null, '/tmp/galaxy.db')
    expect(setE2eGalaxyDbPath).toHaveBeenCalledWith('/tmp/galaxy.db')

    const fixture = { purchasedGames: [] }
    await handlers.get('e2e:set-psn-fixture')!(null, fixture)
    expect(setE2ePsnFixture).toHaveBeenCalledWith(fixture)
  })
})
