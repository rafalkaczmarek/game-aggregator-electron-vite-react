import { beforeEach, vi } from 'vitest'
import type { AggregatedLibrary, GamePlatform } from '@shared/types/game'

export const handlers = new Map<string, (...args: unknown[]) => unknown>()

export const scanAllGames = vi.fn<() => Promise<AggregatedLibrary>>()
export const scanPlatform = vi.fn<(platform: GamePlatform) => Promise<unknown>>()
export const readCachedLibrary = vi.fn<() => Promise<AggregatedLibrary | null>>()
export const writeCachedLibrary = vi.fn<(library: AggregatedLibrary) => Promise<void>>()
export const clearCachedLibrary = vi.fn<() => Promise<void>>()
export const setE2eGalaxyDbPath = vi.fn<(dbPath: string | null) => void>()
export const setE2ePsnFixture = vi.fn<(fixture: unknown) => void>()
export const getSettingsState = vi.fn<() => Promise<unknown>>()
export const updateSteamApiKey = vi.fn<(value: string | undefined) => Promise<void>>()
export const updateGithubPat = vi.fn<(value: string | undefined) => Promise<void>>()
export const getGithubPat = vi.fn<() => Promise<string | undefined>>()
export const updatePsnNpsso = vi.fn<(value: string | undefined) => Promise<void>>()
export const updatePsnOnlineId = vi.fn<(value: string | undefined) => Promise<void>>()
export const enrichLibraryWithMetacritic = vi.fn<
  (
    library: AggregatedLibrary,
    options?: {
      onStart?: (total: number) => void
      onProgress?: (progress: { done: number; total: number; enriched: number }) => void
      onGamesEnriched?: (updates: { gameId: string; rating: { metascore?: number } }[]) => void
    },
  ) => Promise<AggregatedLibrary>
>()
export const getRecommendations = vi.fn<() => Promise<unknown>>()
export const broadcastToRenderers = vi.fn<(channel: string, payload: unknown) => void>()

vi.mock('electron', () => ({
  BrowserWindow: {
    getAllWindows: vi.fn(() => []),
  },
  ipcMain: {
    handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
      handlers.set(channel, handler)
    }),
  },
}))

vi.mock('../../electron/scanners', () => ({
  scanAllGames,
  scanAllGamesWithoutMetacritic: scanAllGames,
  scanPlatform,
}))

vi.mock('../../electron/main/library/store', () => ({
  readCachedLibrary,
  writeCachedLibrary,
  clearCachedLibrary,
}))

vi.mock('../../electron/scanners/gog/paths', () => ({
  setE2eGalaxyDbPath,
}))

vi.mock('../../electron/scanners/psn/e2e', () => ({
  setE2ePsnFixture,
}))

vi.mock('../../electron/main/settings/store', () => ({
  getSettingsState,
  updateSteamApiKey,
  updateGithubPat,
  getGithubPat,
  updatePsnNpsso,
  updatePsnOnlineId,
}))

vi.mock('../../electron/metadata/metacritic', () => ({
  enrichLibraryWithMetacritic,
}))

vi.mock('../../electron/recommendations', () => ({
  getRecommendations,
}))

vi.mock('../../electron/main/ipc/broadcast', () => ({
  broadcastToRenderers,
}))

export async function registerIpcHandlers() {
  const { registerGameIpcHandlers } = await import('../../electron/main/ipc/games')
  const { registerSettingsIpcHandlers } = await import('../../electron/main/ipc/settings')
  registerGameIpcHandlers()
  registerSettingsIpcHandlers()
}

export function resetIpcHandlerMocks() {
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
  enrichLibraryWithMetacritic.mockReset()
  getRecommendations.mockReset()
  broadcastToRenderers.mockReset()
  enrichLibraryWithMetacritic.mockImplementation(async (library, options) => {
    options?.onStart?.(library.games.length)
    options?.onProgress?.({ done: library.games.length, total: library.games.length, enriched: 0 })
    return library
  })
}
