import { NavLink } from 'react-router-dom'
import { SETTINGS_NAV_ITEMS } from '../lib/routes'

function subNavLinkClassName({ isActive }: { isActive: boolean }) {
  return [
    'flex w-full flex-col rounded-2xl border px-4 py-3 text-left transition',
    isActive
      ? 'border-cyan-200 bg-cyan-50 text-cyan-950 shadow-sm'
      : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900',
  ].join(' ')
}

export default function SettingsSubNav() {
  return (
    <nav
      aria-label='Ustawienia platform'
      data-testid='settings-subnav'
      className='grid gap-2 sm:grid-cols-3'
    >
      {SETTINGS_NAV_ITEMS.map((item) => (
        <NavLink
          key={item.id}
          to={item.path}
          data-testid={`settings-nav-${item.id}`}
          className={subNavLinkClassName}
        >
          <span className='text-sm font-semibold'>{item.label}</span>
          <span className='mt-0.5 text-xs text-slate-500'>{item.description}</span>
        </NavLink>
      ))}
    </nav>
  )
}
