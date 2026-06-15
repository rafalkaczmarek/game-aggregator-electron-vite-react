import { useCallback, useState, type FormEvent } from 'react'
import { useSettingsContext } from '../context/SettingsContext'
import { settingsUpdateFactory } from '../lib/settingsUpdateFactory'

export function useGitHubModelsSettings() {
  const { state, update } = useSettingsContext()
  const [draftPat, setDraftPat] = useState('')
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
        if (resetDraft) setDraftPat('')
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

    const result = settingsUpdateFactory({ section: 'github', draftPat })
    if (result.kind === 'message') {
      setMessage(result.message)
      return
    }

    await runUpdate(
      result.update,
      {
        successMessage: 'Token GitHub zapisany.',
        errorMessage: 'Nie udało się zapisać tokenu GitHub.',
      },
      true,
    )
  }

  const clearPat = useCallback(
    () =>
      runUpdate(
        { githubPat: '' },
        {
          successMessage: 'Token GitHub usunięty.',
          errorMessage: 'Nie udało się usunąć tokenu GitHub.',
        },
        true,
      ),
    [runUpdate],
  )

  return {
    configured: state?.githubPatSet ?? false,
    draftPat,
    setDraftPat,
    saving,
    message,
    handleSave,
    clearPat,
  }
}
