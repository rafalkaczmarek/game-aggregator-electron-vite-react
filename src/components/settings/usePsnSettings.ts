import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { settingsUpdateFactory } from './settingsUpdateFactory'
import { useSettingsContext } from './SettingsContext'

export function usePsnSettings() {
  const { state, update } = useSettingsContext()
  const [draftNpsso, setDraftNpsso] = useState('')
  const [draftOnlineId, setDraftOnlineId] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setDraftOnlineId(state?.psnOnlineId ?? '')
  }, [state?.psnOnlineId])

  const runUpdate = useCallback(
    async (
      patch: Parameters<typeof update>[0],
      { successMessage, errorMessage }: { successMessage: string; errorMessage: string },
      resetNpsso = false,
    ) => {
      setSaving(true)
      setMessage(null)

      try {
        const next = await update(patch)
        if (resetNpsso) setDraftNpsso('')
        setDraftOnlineId(next.psnOnlineId ?? '')
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

    const result = settingsUpdateFactory({
      section: 'psn',
      draftNpsso,
      draftOnlineId,
      state,
    })
    if (result.kind === 'message') {
      setMessage(result.message)
      return
    }

    await runUpdate(
      result.update,
      {
        successMessage: 'Settings saved.',
        errorMessage: 'Failed to save settings.',
      },
      Boolean(result.update.psnNpsso),
    )
  }

  const clearNpsso = useCallback(
    () =>
      runUpdate(
        { psnNpsso: '' },
        {
          successMessage: 'PSN NPSSO token removed.',
          errorMessage: 'Failed to clear settings.',
        },
        true,
      ),
    [runUpdate],
  )

  return {
    configured: state?.psnNpssoSet ?? false,
    draftNpsso,
    setDraftNpsso,
    draftOnlineId,
    setDraftOnlineId,
    saving,
    message,
    handleSave,
    clearNpsso,
  }
}
