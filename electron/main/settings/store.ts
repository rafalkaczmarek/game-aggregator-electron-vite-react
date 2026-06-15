import { githubPat, psnNpsso, steamApiKey } from './secretSetting'
import { psnOnlineId } from './plainSetting'
import type { SettingsState } from './types'

export async function getSteamApiKey(): Promise<string | undefined> {
  return steamApiKey.get()
}

export async function getGithubPat(): Promise<string | undefined> {
  return githubPat.get()
}

export async function getPsnNpsso(): Promise<string | undefined> {
  return psnNpsso.get()
}

export async function getPsnOnlineId(): Promise<string | undefined> {
  return psnOnlineId.get()
}

export async function getSettingsState(): Promise<SettingsState> {
  const [key, pat, npsso, onlineId] = await Promise.all([
    getSteamApiKey(),
    getGithubPat(),
    getPsnNpsso(),
    getPsnOnlineId(),
  ])

  return {
    steamApiKeySet: Boolean(key),
    githubPatSet: Boolean(pat),
    psnNpssoSet: Boolean(npsso),
    psnOnlineId: onlineId,
  }
}

export async function updateSteamApiKey(value: string | undefined): Promise<void> {
  await steamApiKey.update(value)
}

export async function updateGithubPat(value: string | undefined): Promise<void> {
  await githubPat.update(value)
}

export async function updatePsnNpsso(value: string | undefined): Promise<void> {
  await psnNpsso.update(value)
}

export async function updatePsnOnlineId(value: string | undefined): Promise<void> {
  await psnOnlineId.update(value)
}
