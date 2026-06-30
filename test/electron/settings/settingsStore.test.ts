import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { testTmpDir } from '@test/helpers/paths'

const tmpDir = testTmpDir('settings-store')

const safeStorage = {
  isEncryptionAvailable: vi.fn(() => false),
  encryptString: vi.fn((value: string) => Buffer.from(value, 'utf8')),
  decryptString: vi.fn((buffer: Buffer) => buffer.toString('utf8')),
}

vi.mock('electron', () => ({
  app: {
    getPath: () => tmpDir,
  },
  safeStorage,
}))

async function loadStore() {
  return import('@electron/main/settings/store')
}

describe('settings store', () => {
  beforeEach(async () => {
    vi.unstubAllEnvs()
    safeStorage.isEncryptionAvailable.mockReturnValue(false)
    safeStorage.decryptString.mockImplementation((buffer: Buffer) => buffer.toString('utf8'))
    await mkdir(tmpDir, { recursive: true })
    vi.resetModules()
  })

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  it('returns steam api key from environment when set', async () => {
    vi.stubEnv('STEAM_API_KEY', ' env-key ')
    const { getSteamApiKey, getSettingsState } = await loadStore()

    await expect(getSteamApiKey()).resolves.toBe('env-key')
    await expect(getSettingsState()).resolves.toEqual({
      steamApiKeySet: true,
      githubPatSet: false,
      psnNpssoSet: false,
    })
  })

  it('persists and reads steam api key from user data', async () => {
    const { updateSteamApiKey, getSteamApiKey, getSettingsState } = await loadStore()

    await updateSteamApiKey('  stored-key  ')
    await expect(getSteamApiKey()).resolves.toBe('stored-key')
    await expect(getSettingsState()).resolves.toEqual({
      steamApiKeySet: true,
      githubPatSet: false,
      psnNpssoSet: false,
    })

    const raw = await readFile(path.join(tmpDir, 'settings.json'), 'utf8')
    expect(JSON.parse(raw)).toHaveProperty('steamApiKeyEnc')
  })

  it('clears stored steam api key', async () => {
    const { updateSteamApiKey, getSteamApiKey, getSettingsState } = await loadStore()

    await updateSteamApiKey('to-remove')
    await updateSteamApiKey('')
    await expect(getSteamApiKey()).resolves.toBeUndefined()
    await expect(getSettingsState()).resolves.toEqual({
      steamApiKeySet: false,
      githubPatSet: false,
      psnNpssoSet: false,
    })
  })

  it('uses safe storage when encryption is available', async () => {
    safeStorage.isEncryptionAvailable.mockReturnValue(true)
    safeStorage.encryptString.mockReturnValue(Buffer.from('cipher'))
    safeStorage.decryptString.mockReturnValue('from-disk')

    const encoded = Buffer.from('cipher').toString('base64')
    await writeFile(
      path.join(tmpDir, 'settings.json'),
      `${JSON.stringify({ steamApiKeyEnc: encoded })}\n`,
      'utf8',
    )

    const { updateSteamApiKey, getSteamApiKey } = await loadStore()

    await updateSteamApiKey('secure-key')
    expect(safeStorage.encryptString).toHaveBeenCalledWith('secure-key')

    vi.resetModules()
    safeStorage.isEncryptionAvailable.mockReturnValue(true)
    safeStorage.decryptString.mockReturnValue('from-disk')
    const { getSteamApiKey: readKey } = await loadStore()
    await expect(readKey()).resolves.toBe('from-disk')
    expect(safeStorage.decryptString).toHaveBeenCalled()
  })

  it('returns undefined when stored key cannot be decrypted', async () => {
    safeStorage.isEncryptionAvailable.mockReturnValue(true)
    safeStorage.decryptString.mockImplementation(() => {
      throw new Error('decrypt failed')
    })

    const encoded = Buffer.from('broken', 'utf8').toString('base64')
    await writeFile(
      path.join(tmpDir, 'settings.json'),
      `${JSON.stringify({ steamApiKeyEnc: encoded })}\n`,
      'utf8',
    )

    const { getSteamApiKey } = await loadStore()
    await expect(getSteamApiKey()).resolves.toBeUndefined()
  })

  it('persists and reads github pat from user data', async () => {
    const { updateGithubPat, getGithubPat, getSettingsState } = await loadStore()

    await updateGithubPat('  github-pat  ')
    await expect(getGithubPat()).resolves.toBe('github-pat')
    await expect(getSettingsState()).resolves.toEqual({
      steamApiKeySet: false,
      githubPatSet: true,
      psnNpssoSet: false,
    })

    const raw = await readFile(path.join(tmpDir, 'settings.json'), 'utf8')
    expect(JSON.parse(raw)).toHaveProperty('githubPatEnc')
  })

  it('returns github pat from environment when set', async () => {
    vi.stubEnv('GITHUB_MODELS_PAT', ' env-github ')
    const { getGithubPat, getSettingsState } = await loadStore()

    await expect(getGithubPat()).resolves.toBe('env-github')
    await expect(getSettingsState()).resolves.toEqual({
      steamApiKeySet: false,
      githubPatSet: true,
      psnNpssoSet: false,
    })
  })

  it('reads legacy gemini key storage as github pat', async () => {
    const encoded = Buffer.from('legacy-key', 'utf8').toString('base64')
    await writeFile(
      path.join(tmpDir, 'settings.json'),
      `${JSON.stringify({ openAiApiKeyEnc: encoded })}\n`,
      'utf8',
    )

    const { getGithubPat } = await loadStore()
    await expect(getGithubPat()).resolves.toBe('legacy-key')
  })

  it('persists and reads psn npsso from user data', async () => {
    const { updatePsnNpsso, getPsnNpsso, getSettingsState } = await loadStore()

    await updatePsnNpsso('  stored-npsso  ')
    await expect(getPsnNpsso()).resolves.toBe('stored-npsso')
    await expect(getSettingsState()).resolves.toEqual({
      steamApiKeySet: false,
      githubPatSet: false,
      psnNpssoSet: true,
    })

    const raw = await readFile(path.join(tmpDir, 'settings.json'), 'utf8')
    expect(JSON.parse(raw)).toHaveProperty('psnNpssoEnc')
  })

  it('persists psn online id as plain text', async () => {
    const { updatePsnOnlineId, getPsnOnlineId, getSettingsState } = await loadStore()

    await updatePsnOnlineId('  player-one  ')
    await expect(getPsnOnlineId()).resolves.toBe('player-one')
    await expect(getSettingsState()).resolves.toEqual({
      steamApiKeySet: false,
      githubPatSet: false,
      psnNpssoSet: false,
      psnOnlineId: 'player-one',
    })
  })

  it('returns psn npsso from environment when set', async () => {
    vi.stubEnv('PSN_NPSSO', ' env-npsso ')
    const { getPsnNpsso, getSettingsState } = await loadStore()

    await expect(getPsnNpsso()).resolves.toBe('env-npsso')
    await expect(getSettingsState()).resolves.toEqual({
      steamApiKeySet: false,
      githubPatSet: false,
      psnNpssoSet: true,
    })
  })

  it('returns psn online id from environment when set', async () => {
    vi.stubEnv('PSN_ONLINE_ID', ' env-player ')
    const { getPsnOnlineId, getSettingsState } = await loadStore()

    await expect(getPsnOnlineId()).resolves.toBe('env-player')
    await expect(getSettingsState()).resolves.toEqual({
      steamApiKeySet: false,
      githubPatSet: false,
      psnNpssoSet: false,
      psnOnlineId: 'env-player',
    })
  })

  it('clears stored psn npsso and online id', async () => {
    const { updatePsnNpsso, updatePsnOnlineId, getPsnNpsso, getPsnOnlineId, getSettingsState } =
      await loadStore()

    await updatePsnNpsso('to-remove')
    await updatePsnOnlineId('player')
    await updatePsnNpsso('')
    await updatePsnOnlineId('')

    await expect(getPsnNpsso()).resolves.toBeUndefined()
    await expect(getPsnOnlineId()).resolves.toBeUndefined()
    await expect(getSettingsState()).resolves.toEqual({
      steamApiKeySet: false,
      githubPatSet: false,
      psnNpssoSet: false,
    })
  })

  it('returns undefined when stored psn npsso cannot be decrypted', async () => {
    safeStorage.isEncryptionAvailable.mockReturnValue(true)
    safeStorage.decryptString.mockImplementation(() => {
      throw new Error('decrypt failed')
    })

    const encoded = Buffer.from('broken', 'utf8').toString('base64')
    await writeFile(
      path.join(tmpDir, 'settings.json'),
      `${JSON.stringify({ psnNpssoEnc: encoded })}\n`,
      'utf8',
    )

    const { getPsnNpsso } = await loadStore()
    await expect(getPsnNpsso()).resolves.toBeUndefined()
  })
})
