import { useQueries } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowRight, Dumbbell, FileQuestion, LayoutList, Sparkles, Users } from 'lucide-react'

import { listExercises, listQuestions, listUsers, queryKeys } from '../api'
import { Badge } from '../components/ui/badge'
import { Card, CardContent } from '../components/ui/card'
import { cn } from '../lib/utils'

export function DashboardPage() {
  const [questionsQ, exercisesQ, usersQ] = useQueries({
    queries: [
      {
        queryKey: queryKeys.questions.all,
        queryFn: listQuestions,
        networkMode: 'always' as const,
      },
      {
        queryKey: queryKeys.exercises.all,
        queryFn: listExercises,
        networkMode: 'always' as const,
      },
      {
        queryKey: queryKeys.users.all,
        queryFn: listUsers,
        networkMode: 'always' as const,
      },
    ],
  })

  const nQuestions = questionsQ.data?.length
  const nExercises = exercisesQ.data?.length
  const nUsers = usersQ.data?.length
  const withVideo = exercisesQ.data?.filter((e) => Boolean(e.video_url || e.video_stream_url)).length
  const cardio = exercisesQ.data?.filter((e) => e.is_cardio).length

  const countLabel = (n: number | undefined, loading: boolean) => {
    if (loading && n === undefined) return '…'
    if (n === undefined) return '—'
    return String(n)
  }

  const quickLinks = [
    {
      to: '/questions',
      title: 'Вопросы анкеты',
      desc: 'Тексты, типы ответов, порядок. Ответы бота использует для подбора упражнений и плана.',
      icon: FileQuestion,
      count: countLabel(nQuestions, questionsQ.isLoading),
    },
    {
      to: '/exercises',
      title: 'Каталог упражнений',
      desc: 'Название, видео, группа для планировщика, мышцы и противопоказания.',
      icon: Dumbbell,
      count: countLabel(nExercises, exercisesQ.isLoading),
    },
    {
      to: '/users',
      title: 'Пользователи',
      desc: 'Список зарегистрированных в боте (тариф, активность — по мере появления полей в API).',
      icon: Users,
      count: countLabel(nUsers, usersQ.isLoading),
    },
  ] as const

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Дашборд</h2>
        <p className="text-sm text-secondary-foreground/80">
          Сводка по данным из API и быстрый переход в основные разделы.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Вопросов в анкете', value: countLabel(nQuestions, questionsQ.isLoading) },
          { label: 'Упражнений в каталоге', value: countLabel(nExercises, exercisesQ.isLoading) },
          { label: 'С видео', value: countLabel(withVideo, exercisesQ.isLoading) },
          { label: 'Кардио в каталоге', value: countLabel(cardio, exercisesQ.isLoading) },
        ].map((m) => (
          <Card key={m.label}>
            <CardContent className="p-4">
              <div className="text-xs text-secondary-foreground/80">{m.label}</div>
              <div className="mt-2 text-2xl font-semibold tabular-nums">{m.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {quickLinks.map((item) => (
          <Card key={item.to} className="overflow-hidden border-border/80" style={{ backgroundColor: 'var(--surface-section)' }}>
            <CardContent className="flex h-full flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <item.icon className="h-5 w-5 text-primary" />
                  <span className="font-medium leading-tight">{item.title}</span>
                </div>
                <Badge variant="muted" className="shrink-0 tabular-nums">
                  {item.count}
                </Badge>
              </div>
              <p className="mt-2 flex-1 text-sm text-secondary-foreground/85">{item.desc}</p>
              <Link
                to={item.to}
                className={cn(
                  'mt-4 inline-flex h-9 w-full items-center justify-between gap-2 rounded-md border border-border',
                  'bg-secondary px-3 text-sm font-medium text-foreground transition-colors hover:bg-card hover:border-border/90',
                )}
              >
                Открыть
                <ArrowRight className="h-4 w-4 shrink-0" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Sparkles className="h-4 w-4 text-warning" />
            Как устроен план тренировок в боте
          </div>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-secondary-foreground/90">
            <li>Пользователь проходит анкету — ответы сохраняются в боте.</li>
            <li>Бот подбирает упражнения из этого каталога с учётом ограничений.</li>
            <li>Строится помесячный план; в Telegram раздел «Мой план» и команда /myplan.</li>
          </ol>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              to="/exercises/new"
              className={cn(
                'inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-primary-foreground',
                'shadow-[0_14px_40px_rgb(var(--accent-rgb)_/_0.18)] transition-[filter] hover:brightness-95',
              )}
              style={{
                backgroundImage:
                  'linear-gradient(90deg, rgb(var(--accent-rgb) / 0.95), rgb(var(--sky-rgb) / 0.75))',
              }}
            >
              <LayoutList className="h-4 w-4" />
              Добавить упражнение
            </Link>
            <Link
              to="/questions/new"
              className="inline-flex h-9 items-center rounded-md border border-border bg-secondary px-3 text-sm font-medium hover:bg-card"
            >
              Новый вопрос
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-sm text-secondary-foreground/80">
          Агрегированные метрики (DAU, воронка анкеты) появятся здесь, когда на бэкенде будут отдельные эндпоинты
          статистики.
        </CardContent>
      </Card>
    </div>
  )
}
