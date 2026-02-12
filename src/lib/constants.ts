import { BarChart3, Dumbbell, HelpCircle, LayoutDashboard, Settings, Users } from 'lucide-react'
import { Activity } from 'lucide-react'

export const navItems = [
  { to: '/dashboard', label: 'Дашборд', icon: LayoutDashboard },
  { to: '/questions', label: 'Вопросы', icon: HelpCircle },
  { to: '/users', label: 'Пользователи', icon: Users },
  { to: '/workouts', label: 'Тренировки', icon: Dumbbell },
  { to: '/exercises', label: 'Упражнения', icon: Activity },
  { to: '/analytics', label: 'Аналитика', icon: BarChart3 },
  { to: '/settings', label: 'Настройки', icon: Settings },
] as const

