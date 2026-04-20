import { Outlet } from 'react-router-dom'

import { Header } from './Header.tsx'
import { MobileNav } from './MobileNav.tsx'
import { Sidebar } from './Sidebar.tsx'

export function MainLayout() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Header />

      <div className="mx-auto flex w-full max-w-7xl gap-4 px-4 pb-20 pt-4 lg:pb-8">
        <aside className="hidden lg:block lg:w-64">
          <Sidebar />
        </aside>

        <main
          className="min-w-0 flex-1 rounded-2xl border border-border/80 p-3 shadow-[0_8px_24px_rgba(0,0,0,0.22)] md:p-4"
          style={{ backgroundColor: 'var(--surface-page)' }}
        >
          <Outlet />
        </main>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border/70 bg-card lg:hidden">
        <MobileNav />
      </div>
    </div>
  )
}

