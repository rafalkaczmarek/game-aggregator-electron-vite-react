import { SettingsProvider } from './context/SettingsContext'
import PsnSettings from './ui/PsnSettings'
import SteamSettings from './ui/SteamSettings'

export default function Settings() {
  return (
    <SettingsProvider>
      <section className='rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.35)]'>
        <div className='space-y-1'>
          <div className='text-sm uppercase tracking-[0.3em] text-slate-500'>Settings</div>
          <p className='text-sm text-slate-600'>
            Secrets are stored in the main process only. Steam Web API enriches your library with
            titles, playtime, and covers. PSN uses your NPSSO token to fetch trophy titles from
            PlayStation Network.
          </p>
        </div>

        <div className='mt-6 space-y-8'>
          <SteamSettings />
          <PsnSettings />
        </div>
      </section>
    </SettingsProvider>
  )
}
