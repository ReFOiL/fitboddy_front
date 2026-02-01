import { BarChart3, Dumbbell, LayoutDashboard, Settings, Users } from 'lucide-react'

export const navItems = [
  { to: '/dashboard', label: 'Дашборд', icon: LayoutDashboard },
  { to: '/questions', label: 'Вопросы', icon: Users },
  { to: '/workouts', label: 'Тренировки', icon: Dumbbell },
  { to: '/analytics', label: 'Аналитика', icon: BarChart3 },
  { to: '/settings', label: 'Настройки', icon: Settings },
] as const

