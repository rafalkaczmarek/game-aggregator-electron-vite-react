import type { SettingsState, SettingsUpdate } from '@shared/types/settings'

export type SettingsUpdateFactoryResult =
  | { kind: 'update'; update: SettingsUpdate }
  | { kind: 'message'; message: string }

type SecretFieldKey = 'steamApiKey' | 'psnNpsso'

interface SecretFieldRule {
  draft: string
  field: SecretFieldKey
  emptyErrorMessage: string
}

type SecretFieldOutcome =
  | { kind: 'set'; value: string }
  | { kind: 'error'; message: string }
  | { kind: 'skip' }

function resolveSecretField({ draft, emptyErrorMessage }: SecretFieldRule): SecretFieldOutcome {
  const trimmed = draft.trim()

  if (trimmed) {
    return { kind: 'set', value: trimmed }
  }

  if (draft.length > 0) {
    return { kind: 'error', message: emptyErrorMessage }
  }

  return { kind: 'skip' }
}

function buildSteamUpdate(draftKey: string): SettingsUpdateFactoryResult {
  const secret = resolveSecretField({
    draft: draftKey,
    field: 'steamApiKey',
    emptyErrorMessage: 'Steam API key cannot be empty. Use Clear key to remove it.',
  })

  if (secret.kind === 'error') {
    return { kind: 'message', message: secret.message }
  }

  if (secret.kind === 'skip') {
    return { kind: 'message', message: 'No changes to save.' }
  }

  return { kind: 'update', update: { steamApiKey: secret.value } }
}

interface PsnUpdateInput {
  draftNpsso: string
  draftOnlineId: string
  state: SettingsState | null
}

function buildPsnUpdate({
  draftNpsso,
  draftOnlineId,
  state,
}: PsnUpdateInput): SettingsUpdateFactoryResult {
  const secret = resolveSecretField({
    draft: draftNpsso,
    field: 'psnNpsso',
    emptyErrorMessage: 'PSN NPSSO token cannot be empty. Use Clear token to remove it.',
  })

  if (secret.kind === 'error') {
    return { kind: 'message', message: secret.message }
  }

  const trimmedOnlineId = draftOnlineId.trim()
  const savedOnlineId = state?.psnOnlineId ?? ''
  const update: SettingsUpdate = {}

  if (secret.kind === 'set') {
    update.psnNpsso = secret.value
  }

  if (trimmedOnlineId !== savedOnlineId) {
    update.psnOnlineId = trimmedOnlineId
  }

  if (Object.keys(update).length === 0) {
    return { kind: 'message', message: 'No changes to save.' }
  }

  return { kind: 'update', update }
}

export type SettingsUpdateSection = 'steam' | 'psn'

export type SettingsUpdateFactoryInput =
  | { section: 'steam'; draftKey: string }
  | { section: 'psn'; draftNpsso: string; draftOnlineId: string; state: SettingsState | null }

const settingsUpdateBuilders: {
  [S in SettingsUpdateSection]: (
    input: Extract<SettingsUpdateFactoryInput, { section: S }>,
  ) => SettingsUpdateFactoryResult
} = {
  steam: (input) => buildSteamUpdate(input.draftKey),
  psn: (input) =>
    buildPsnUpdate({
      draftNpsso: input.draftNpsso,
      draftOnlineId: input.draftOnlineId,
      state: input.state,
    }),
}

export function settingsUpdateFactory(
  input: SettingsUpdateFactoryInput,
): SettingsUpdateFactoryResult {
  if (input.section === 'steam') {
    return settingsUpdateBuilders.steam(input)
  }
  return settingsUpdateBuilders.psn(input)
}
