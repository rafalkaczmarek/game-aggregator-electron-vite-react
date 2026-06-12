import { useCallback, useState, type FormEvent } from 'react'
import { settingsUpdateFactory } from './settingsUpdateFactory'
import { useSettingsContext } from './SettingsContext'

export function useSteamSettings() {
  const { state, update } = useSettingsContext()
  const [draftKey, setDraftKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const runUpdate = useCallback(
    async (
      patch: Parameters<typeof update>[0],
      { successMessage, errorMessage }: { successMessage: string; errorMessage: string },
      resetDraft = false,
    ) => {
      setSaving(true)
      setMessage(null)

      try {
        await update(patch)
        if (resetDraft) setDraftKey('')
        setMessage(successMessage)
      } catch (error) {
        setMessage(error instanceof Error ? error.message : errorMessage)
      } finally {
        setSaving(false)
      }
    },
    [update],
  )

  async function handleSave(event: FormEvent) {
    event.preventDefault()

    const result = settingsUpdateFactory({ section: 'steam', draftKey })
    if (result.kind === 'message') {
      setMessage(result.message)
      return
    }

    await runUpdate(result.update, {
      successMessage: 'Settings saved.',
      errorMessage: 'Failed to save settings.',
    }, true)
  }

  const clearKey = useCallback(
    () =>
      runUpdate(
        { steamApiKey: '' },
        {
          successMessage: 'Steam API key removed.',
          errorMessage: 'Failed to clear settings.',
        },
        true,
      ),
    [runUpdate],
  )

  return {
    configured: state?.steamApiKeySet ?? false,
    draftKey,
    setDraftKey,
    saving,
    message,
    handleSave,
    clearKey,
  }
}
