import { Outlet } from 'react-router-dom'
import SidebarNav from './ui/SidebarNav'

export default function AppShell() {
  return (
    <div className='relative flex min-h-screen overflow-hidden bg-slate-50 text-slate-900'>
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute -left-28 top-10 h-96 w-96 rounded-full bg-cyan-200/50 blur-3xl' />
        <div className='absolute -right-24 top-28 h-96 w-96 rounded-full bg-sky-200/40 blur-3xl' />
        <div className='absolute bottom-0 left-1/2 h-72 w-[46rem] -translate-x-1/2 bg-gradient-to-r from-cyan-200/0 via-cyan-300/45 to-cyan-200/0 blur-3xl' />
      </div>

      <div className='relative flex min-h-screen w-full'>
        <SidebarNav />
        <main className='min-h-screen flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8'>
          <div className='mx-auto w-full max-w-5xl'>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
