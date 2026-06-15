import { NavLink } from 'react-router-dom'
import { APP_NAV_ITEMS } from '../lib/routes'

function navLinkClassName({ isActive }: { isActive: boolean }) {
  return [
    'flex w-full flex-col rounded-2xl border px-4 py-3 text-left transition',
    isActive
      ? 'border-cyan-200 bg-cyan-50 text-cyan-950 shadow-sm'
      : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-white/80 hover:text-slate-900',
  ].join(' ')
}

export default function SidebarNav() {
  return (
    <aside
      data-testid='app-sidebar'
      className='relative z-10 flex w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white/80 px-4 py-6 backdrop-blur'
    >
      <div className='mb-8 px-2'>
        <div className='inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[0.65rem] font-medium uppercase tracking-[0.24em] text-cyan-800'>
          Game Aggregator
        </div>
        <p className='mt-3 text-sm leading-6 text-slate-500'>
          Steam, GOG, Epic i PSN w jednej aplikacji.
        </p>
      </div>

      <nav aria-label='Główna nawigacja' className='space-y-2'>
        {APP_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === '/'}
            data-testid={`nav-${item.id}`}
            className={navLinkClassName}
          >
            <span className='text-sm font-semibold'>{item.label}</span>
            <span className='mt-0.5 text-xs text-slate-500'>{item.description}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
