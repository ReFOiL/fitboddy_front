import { BarChart3, Dumbbell, HelpCircle, LayoutDashboard, Settings, UserCog, Users } from 'lucide-react'

export const navItems = [
  { to: '/dashboard', label: 'Дашборд', icon: LayoutDashboard },
  { to: '/questions', label: 'Вопросы', icon: HelpCircle },
  { to: '/users', label: 'Пользователи', icon: Users },
  { to: '/exercises', label: 'Каталог упражнений', icon: Dumbbell },
  { to: '/analytics', label: 'Аналитика', icon: BarChart3 },
  { to: '/settings', label: 'Настройки', icon: Settings },
] as const

/** Только для суперпользователя (bootstrap из .env). */
export const superuserNavItems = [{ to: '/admin-accounts', label: 'Админы', icon: UserCog }] as const

