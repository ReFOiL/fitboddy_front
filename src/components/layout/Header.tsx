import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { useAuth } from '../../hooks/use-auth'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'

export function Header() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-card">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
          <div className="flex items-center gap-2">
            <div className="font-semibold tracking-tight">Fitboddy Admin</div>
            <Badge variant="muted">beta</Badge>
          </div>
          <span className="text-xs text-secondary-foreground/75 sm:text-sm">Каталог, анкета, пользователи</span>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            logout()
            toast.message('Вы вышли из системы')
            navigate('/login', { replace: true })
          }}
        >
          <LogOut className="h-4 w-4" />
          Выйти
        </Button>
      </div>
    </header>
  )
}

