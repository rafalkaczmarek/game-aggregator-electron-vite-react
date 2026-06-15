import { useSteamSettings } from '../hooks/useSteamSettings'
import { SecretField } from './SecretField'

export default function SteamSettings() {
  const { configured, draftKey, setDraftKey, saving, message, handleSave, clearKey } =
    useSteamSettings()

  return (
    <form onSubmit={handleSave} className='space-y-4'>
      <SecretField
        id='steam-api-key'
        label='Steam Web API key'
        value={draftKey}
        onChange={setDraftKey}
        placeholder={
          configured ? 'Key configured — enter a new key to replace' : 'Paste your API key'
        }
        hint={
          <>
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
          </>
        }
        configured={configured}
        clearLabel='Clear key'
        configuredLabel='Steam API key configured'
        onClear={clearKey}
        disabled={saving}
      />

      <div className='flex flex-wrap items-center gap-3'>
        <button
          type='submit'
          disabled={saving}
          className='inline-flex items-center justify-center rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-600 disabled:opacity-60'
        >
          {saving ? 'Saving…' : 'Save API key'}
        </button>
      </div>

      {message && <p className='text-sm text-slate-600'>{message}</p>}
    </form>
  )
}
