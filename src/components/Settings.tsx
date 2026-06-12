import { useEffect, useState } from 'react'
import type { SettingsState } from '@shared/types/settings'

export default function Settings() {
  const [state, setState] = useState<SettingsState | null>(null)
  const [steamApiKey, setSteamApiKey] = useState('')
  const [psnNpsso, setPsnNpsso] = useState('')
  const [psnOnlineId, setPsnOnlineId] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    void window.settingsApi.get().then((next) => {
      setState(next)
      setPsnOnlineId(next.psnOnlineId ?? '')
    })
  }, [])

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const trimmedKey = steamApiKey.trim()
      const trimmedNpsso = psnNpsso.trim()
      const trimmedOnlineId = psnOnlineId.trim()

      if (!trimmedKey && !trimmedNpsso && trimmedOnlineId === (state?.psnOnlineId ?? '')) {
        setMessage('No changes to save.')
        return
      }

      const update: Parameters<typeof window.settingsApi.update>[0] = {}

      if (trimmedKey) {
        update.steamApiKey = trimmedKey
      } else if (steamApiKey.length > 0) {
        setMessage('Steam API key cannot be empty. Use Clear key to remove it.')
        return
      }

      if (trimmedNpsso) {
        update.psnNpsso = trimmedNpsso
      } else if (psnNpsso.length > 0) {
        setMessage('PSN NPSSO token cannot be empty. Use Clear token to remove it.')
        return
      }

      if (trimmedOnlineId !== (state?.psnOnlineId ?? '')) {
        update.psnOnlineId = trimmedOnlineId
      }

      if (Object.keys(update).length === 0) {
        setMessage(
          state?.steamApiKeySet || state?.psnNpssoSet
            ? 'Existing secrets kept unchanged.'
            : 'No settings provided.',
        )
        return
      }

      const next = await window.settingsApi.update(update)
      setState(next)
      setSteamApiKey('')
      setPsnNpsso('')
      setPsnOnlineId(next.psnOnlineId ?? '')
      setMessage('Settings saved.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  async function handleClearSteamKey() {
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

  async function handleClearPsnNpsso() {
    setSaving(true)
    setMessage(null)

    try {
      const next = await window.settingsApi.update({ psnNpsso: '' })
      setState(next)
      setPsnNpsso('')
      setMessage('PSN NPSSO token removed.')
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
          titles, playtime, and covers. PSN uses your NPSSO token to fetch trophy titles from
          PlayStation Network.
        </p>
      </div>

      <form onSubmit={handleSave} className='mt-6 space-y-8'>
        <div className='space-y-4'>
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
              placeholder={
                state?.steamApiKeySet
                  ? 'Key configured — enter a new key to replace'
                  : 'Paste your API key'
              }
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
              .
            </p>
          </div>

          {state?.steamApiKeySet && (
            <div className='flex flex-wrap items-center gap-3'>
              <button
                type='button'
                onClick={handleClearSteamKey}
                disabled={saving}
                className='inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 disabled:opacity-60'
              >
                Clear key
              </button>
              <span className='text-sm text-emerald-700'>Steam API key configured</span>
            </div>
          )}
        </div>

        <div className='space-y-4 border-t border-slate-100 pt-8'>
          <div className='space-y-2'>
            <label htmlFor='psn-npsso' className='block text-sm font-medium text-slate-700'>
              PSN NPSSO token
            </label>
            <input
              id='psn-npsso'
              type='password'
              autoComplete='off'
              value={psnNpsso}
              onChange={(event) => setPsnNpsso(event.target.value)}
              placeholder={
                state?.psnNpssoSet
                  ? 'Token configured — enter a new token to replace'
                  : 'Paste your NPSSO token'
              }
              className='w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-2 focus:ring-cyan-100'
            />
            <p className='text-xs leading-5 text-slate-500'>
              Sign in at playstation.com, then open{' '}
              <a
                href='https://ca.account.sony.com/api/v1/ssocookie'
                target='_blank'
                rel='noreferrer'
                className='text-cyan-700 underline-offset-2 hover:underline'
              >
                ca.account.sony.com/api/v1/ssocookie
              </a>{' '}
              in the same browser and copy the npsso value.
            </p>
          </div>

          <div className='space-y-2'>
            <label htmlFor='psn-online-id' className='block text-sm font-medium text-slate-700'>
              PSN Online ID (optional)
            </label>
            <input
              id='psn-online-id'
              type='text'
              autoComplete='off'
              value={psnOnlineId}
              onChange={(event) => setPsnOnlineId(event.target.value)}
              placeholder='Leave empty to scan your own library'
              className='w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-2 focus:ring-cyan-100'
            />
            <p className='text-xs leading-5 text-slate-500'>
              Public PSN username to scan a visible trophy list instead of your purchased library.
              Purchased games are only available for the authenticated account.
            </p>
          </div>

          {state?.psnNpssoSet && (
            <div className='flex flex-wrap items-center gap-3'>
              <button
                type='button'
                onClick={handleClearPsnNpsso}
                disabled={saving}
                className='inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 disabled:opacity-60'
              >
                Clear token
              </button>
              <span className='text-sm text-emerald-700'>PSN NPSSO configured</span>
            </div>
          )}
        </div>

        <div className='flex flex-wrap items-center gap-3 border-t border-slate-100 pt-8'>
          <button
            type='submit'
            disabled={saving}
            className='inline-flex items-center justify-center rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-600 disabled:opacity-60'
          >
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </div>

        {message && <p className='text-sm text-slate-600'>{message}</p>}
      </form>
    </section>
  )
}
