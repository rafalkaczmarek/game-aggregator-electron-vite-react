import { useEffect, useState } from 'react'
import type { SettingsState } from '@shared/types/settings'

export default function Settings() {
  const [state, setState] = useState<SettingsState | null>(null)
  const [steamApiKey, setSteamApiKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    void window.settingsApi.get().then(setState)
  }, [])

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const trimmedKey = steamApiKey.trim()
      if (!trimmedKey) {
        setMessage(
          state?.steamApiKeySet
            ? 'Existing API key kept unchanged.'
            : 'No API key provided.',
        )
        return
      }

      const next = await window.settingsApi.update({ steamApiKey: trimmedKey })
      setState(next)
      setSteamApiKey('')
      setMessage('Steam API key saved.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  async function handleClear() {
    setSaving(true)
    setMessage(null)

    try {
      const next = await window.settingsApi.update({ steamApiKey: '' })
      setState(next)
      setSteamApiKey('')
      setMessage('Steam API key removed.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to clear settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className='rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.35)]'>
      <div className='space-y-1'>
        <div className='text-sm uppercase tracking-[0.3em] text-slate-500'>Settings</div>
        <p className='text-sm text-slate-600'>
          Secrets are stored in the main process only. Steam Web API enriches your library with
          titles, playtime, and covers.
        </p>
      </div>

      <form onSubmit={handleSave} className='mt-6 space-y-4'>
        <div className='space-y-2'>
          <label htmlFor='steam-api-key' className='block text-sm font-medium text-slate-700'>
            Steam Web API key
          </label>
          <input
            id='steam-api-key'
            type='password'
            autoComplete='off'
            value={steamApiKey}
            onChange={(event) => setSteamApiKey(event.target.value)}
            placeholder={state?.steamApiKeySet ? 'Key configured — enter a new key to replace' : 'Paste your API key'}
            className='w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-2 focus:ring-cyan-100'
          />
          <p className='text-xs leading-5 text-slate-500'>
            Get a key at{' '}
            <a
              href='https://steamcommunity.com/dev/apikey'
              target='_blank'
              rel='noreferrer'
              className='text-cyan-700 underline-offset-2 hover:underline'
            >
              steamcommunity.com/dev/apikey
            </a>
            . Leave empty and save to keep the current key; use Clear to remove it.
          </p>
        </div>

        <div className='flex flex-wrap items-center gap-3'>
          <button
            type='submit'
            disabled={saving}
            className='inline-flex items-center justify-center rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-600 disabled:opacity-60'
          >
            {saving ? 'Saving…' : 'Save settings'}
          </button>
          {state?.steamApiKeySet && (
            <button
              type='button'
              onClick={handleClear}
              disabled={saving}
              className='inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 disabled:opacity-60'
            >
              Clear key
            </button>
          )}
          {state?.steamApiKeySet && (
            <span className='text-sm text-emerald-700'>API key configured</span>
          )}
        </div>

        {message && <p className='text-sm text-slate-600'>{message}</p>}
      </form>
    </section>
  )
}
