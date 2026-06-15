import { useGitHubModelsSettings } from '../hooks/useGitHubModelsSettings'
import { SecretField } from './SecretField'

export default function GitHubModelsSettings() {
  const { configured, draftPat, setDraftPat, saving, message, handleSave, clearPat } =
    useGitHubModelsSettings()

  return (
    <form onSubmit={handleSave} className='space-y-4'>
      <div className='space-y-1'>
        <h3 className='text-sm font-semibold text-slate-900'>Rekomendacje AI (GitHub Models)</h3>
        <p className='text-sm text-slate-600'>
          Personal Access Token z GitHub z zakresem <code className='text-xs'>models</code> daje
          darmowy dostęp do modeli w GitHub Marketplace — w tym{' '}
          <code className='text-xs'>gpt-4.1-mini</code>. Wystarczy na POC bez osobnej faktury za AI.
        </p>
      </div>

      <SecretField
        id='github-pat'
        label='GitHub Personal Access Token'
        value={draftPat}
        onChange={setDraftPat}
        placeholder={
          configured ? 'Token skonfigurowany — wklej nowy, aby podmienić' : 'Wklej token PAT'
        }
        hint={
          <>
            Utwórz token na{' '}
            <a
              href='https://github.com/settings/tokens'
              target='_blank'
              rel='noreferrer'
              className='text-cyan-700 underline-offset-2 hover:underline'
            >
              github.com/settings/tokens
            </a>{' '}
            z zakresem <strong>models</strong> (lub <strong>read:models</strong>). Model:{' '}
            <a
              href='https://github.com/marketplace/models/azure-openai/gpt-4-1-mini/playground'
              target='_blank'
              rel='noreferrer'
              className='text-cyan-700 underline-offset-2 hover:underline'
            >
              gpt-4.1-mini
            </a>
            .
          </>
        }
        configured={configured}
        clearLabel='Usuń token'
        configuredLabel='Token GitHub skonfigurowany'
        onClear={clearPat}
        disabled={saving}
      />

      <div className='flex flex-wrap items-center gap-3'>
        <button
          type='submit'
          disabled={saving}
          className='inline-flex items-center justify-center rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-600 disabled:opacity-60'
        >
          {saving ? 'Zapisywanie…' : 'Zapisz token GitHub'}
        </button>
      </div>

      {message && <p className='text-sm text-slate-600'>{message}</p>}
    </form>
  )
}
