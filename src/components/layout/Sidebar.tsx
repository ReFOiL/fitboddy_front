import { NavLink } from 'react-router-dom'

import { cn } from '../../lib/utils'
import { useNavItems } from '../../hooks/use-nav-items'
import { Card, CardContent } from '../ui/card'

export function Sidebar() {
  const nav = useNavItems()
  return (
    <Card>
      <CardContent className="p-2">
        <div className="px-2 pb-2 text-xs font-medium text-secondary-foreground/80">Разделы</div>
        <div className="flex flex-col gap-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive ? 'bg-primary text-primary-foreground shadow-[0_2px_8px_rgba(0,0,0,0.2)]' : 'hover:bg-secondary',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

