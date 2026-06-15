import PsnSettings from './PsnSettings'

export default function PsnSettingsPage() {
  return (
    <div data-testid='settings-page-psn'>
      <div className='space-y-1'>
        <h2 className='text-lg font-semibold text-slate-900'>PlayStation Network</h2>
        <p className='text-sm text-slate-600'>
          Token NPSSO pozwala pobrać tytuły trofeów z PlayStation Network. Online ID służy do
          skanowania publicznego profilu zamiast własnej biblioteki.
        </p>
      </div>

      <div className='mt-6'>
        <PsnSettings />
      </div>
    </div>
  )
}
