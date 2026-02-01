import { Outlet } from 'react-router-dom'

import { Header } from './Header'
import { MobileNav } from './MobileNav'
import { Sidebar } from './Sidebar'

export function MainLayout() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Header />

      <div className="mx-auto flex w-full max-w-7xl gap-4 px-4 pb-20 pt-4 lg:pb-8">
        <aside className="hidden lg:block lg:w-64">
          <Sidebar />
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border/70 bg-secondary/70 backdrop-blur lg:hidden">
        <MobileNav />
      </div>
    </div>
  )
}

