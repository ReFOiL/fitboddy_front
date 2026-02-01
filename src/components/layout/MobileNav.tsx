import { NavLink } from 'react-router-dom'

import { cn } from '../../lib/utils'
import { navItems } from '../../lib/constants'

export function MobileNav() {
  return (
    <nav className="mx-auto grid max-w-7xl grid-cols-5 gap-1 px-2 py-2">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex h-12 flex-col items-center justify-center gap-1 rounded-md text-[10px] transition-colors',
              isActive ? 'bg-primary text-primary-foreground' : 'text-secondary-foreground/80 hover:bg-secondary/50',
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

