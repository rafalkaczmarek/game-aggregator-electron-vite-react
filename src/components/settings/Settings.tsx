import { Outlet } from 'react-router-dom'
import { SettingsProvider } from './context/SettingsContext'
import SettingsSubNav from './ui/SettingsSubNav'

export default function Settings() {
  return (
    <SettingsProvider>
      <section
        data-testid='settings-section'
        className='rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.35)]'
      >
        <div className='space-y-1'>
          <div className='text-sm uppercase tracking-[0.3em] text-slate-500'>Ustawienia</div>
          <p className='text-sm text-slate-600'>
            Sekrety i klucze API są przechowywane wyłącznie w main process. Wybierz platformę, aby
            skonfigurować połączenie.
          </p>
        </div>

        <div className='mt-6'>
          <SettingsSubNav />
        </div>

        <div className='mt-8'>
          <Outlet />
        </div>
      </section>
    </SettingsProvider>
  )
}
