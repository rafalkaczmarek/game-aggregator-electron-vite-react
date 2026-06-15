import { usePsnSettings } from '../hooks/usePsnSettings'
import { SecretField, settingsInputClassName } from './SecretField'

export default function PsnSettings() {
  const {
    configured,
    draftNpsso,
    setDraftNpsso,
    draftOnlineId,
    setDraftOnlineId,
    saving,
    message,
    handleSave,
    clearNpsso,
  } = usePsnSettings()

  return (
    <form onSubmit={handleSave} className='space-y-4 border-t border-slate-100 pt-8'>
      <SecretField
        id='psn-npsso'
        label='PSN NPSSO token'
        value={draftNpsso}
        onChange={setDraftNpsso}
        placeholder={
          configured ? 'Token configured — enter a new token to replace' : 'Paste your NPSSO token'
        }
        hint={
          <>
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
          </>
        }
        configured={configured}
        clearLabel='Clear token'
        configuredLabel='PSN NPSSO configured'
        onClear={clearNpsso}
        disabled={saving}
      />

      <div className='space-y-2'>
        <label htmlFor='psn-online-id' className='block text-sm font-medium text-slate-700'>
          PSN Online ID (optional)
        </label>
        <input
          id='psn-online-id'
          type='text'
          autoComplete='off'
          value={draftOnlineId}
          onChange={(event) => setDraftOnlineId(event.target.value)}
          placeholder='Leave empty to scan your own library'
          className={settingsInputClassName}
        />
        <p className='text-xs leading-5 text-slate-500'>
          Public PSN username to scan a visible trophy list instead of your purchased library.
          Purchased games are only available for the authenticated account.
        </p>
      </div>

      <div className='flex flex-wrap items-center gap-3'>
        <button
          type='submit'
          disabled={saving}
          className='inline-flex items-center justify-center rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-600 disabled:opacity-60'
        >
          {saving ? 'Saving…' : 'Save account settings'}
        </button>
      </div>

      {message && <p className='text-sm text-slate-600'>{message}</p>}
    </form>
  )
}
