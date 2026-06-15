import SteamSettings from './SteamSettings'

export default function SteamSettingsPage() {
  return (
    <div data-testid='settings-page-steam'>
      <div className='space-y-1'>
        <h2 className='text-lg font-semibold text-slate-900'>Steam</h2>
        <p className='text-sm text-slate-600'>
          Steam Web API wzbogaca bibliotekę o tytuły, czas gry i okładki. Klucz jest przechowywany
          tylko w main process.
        </p>
      </div>

      <div className='mt-6'>
        <SteamSettings />
      </div>
    </div>
  )
}
