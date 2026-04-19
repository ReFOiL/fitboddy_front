import { NavLink } from 'react-router-dom'

import { useNavItems } from '../../hooks/use-nav-items'
import { cn } from '../../lib/utils'

export function MobileNav() {
  const nav = useNavItems()
  return (
    <nav
      className={cn(
        'mx-auto grid max-w-7xl gap-1 px-2 py-2',
        nav.length > 7 ? 'grid-cols-4 sm:grid-cols-8' : 'grid-cols-3 sm:grid-cols-6',
      )}
    >
      {nav.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex h-12 flex-col items-center justify-center gap-1 rounded-md text-[10px] transition-colors',
              isActive ? 'bg-primary text-primary-foreground' : 'text-secondary-foreground/80 hover:bg-secondary',
            )
          }
        >
          <Icon className="h-5 w-5" />
          <span className="leading-none">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

