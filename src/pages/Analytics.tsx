import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  CalendarClock,
  ChartLine,
  Download,
  Repeat,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { getWorkoutAnalyticsSummary, queryKeys } from '../api'
import type { WorkoutAnalyticsSummaryOut } from '../types/analytics'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Select } from '../components/ui/select'

function percent(value: number) {
  return `${Math.round(value * 100)}%`
}

function ProgressBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value * 100)))
  return (
    <div className="h-2 rounded-full bg-secondary">
      <div
        className="h-2 rounded-full bg-primary transition-all"
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}

function conversionLabel(value: number) {
  if (value <= 0) return '—'
  return `${Math.round(value * 100)}%`
}

function toPercentNumber(value: number) {
  return Math.round(value * 100)
}

function exportAnalyticsCsv(data: WorkoutAnalyticsSummaryOut, filters: Record<string, string | undefined>) {
  const rows: string[] = []
  const filterLabel = Object.entries(filters)
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => `${key}=${value}`)
    .join('; ')

  rows.push(`"Filters","${filterLabel || 'none'}"`)
  rows.push('"Metric","Value"')
  rows.push(`"Users total","${data.users_total}"`)
  rows.push(`"Users with profile","${data.users_with_profile}"`)
  rows.push(`"Users with 2+ cycles","${data.users_with_2_cycles}"`)
  rows.push(`"D7 retention","${toPercentNumber(data.d7_retention_rate)}%"`)
  rows.push(`"D30 retention","${toPercentNumber(data.d30_retention_rate)}%"`)
  rows.push(`"Avg completion","${toPercentNumber(data.avg_cycle_completion_rate)}%"`)
  rows.push(`"Avg adherence","${toPercentNumber(data.avg_adherence_score)}%"`)
  rows.push(`"Avg novelty","${toPercentNumber(data.avg_novelty_ratio)}%"`)
  rows.push(`"Plans this week","${data.plans_generated_this_week}"`)
  rows.push(`"Plans prev week","${data.plans_generated_prev_week}"`)
  rows.push(`"Workouts this week","${data.workouts_completed_this_week}"`)
  rows.push(`"Workouts prev week","${data.workouts_completed_prev_week}"`)
  rows.push('')
  rows.push('"Cohort week","Users","D7","D30"')
  for (const row of data.retention_cohorts) {
    rows.push(`"${row.cohort_week}","${row.users_count}","${toPercentNumber(row.d7_rate)}%","${toPercentNumber(row.d30_rate)}%"`)
  }
  rows.push('')
  rows.push('"Funnel step","Users","Conversion from prev"')
  for (const row of data.cycle_funnel) {
    rows.push(`"${row.title}","${row.users_count}","${toPercentNumber(row.conversion_from_prev)}%"`)
  }
  rows.push('')
  rows.push('"Alerts"')
  for (const alert of data.alerts) {
    rows.push(`"${alert.severity}: ${alert.title} - ${alert.description.replaceAll('"', "'")}"`)
  }

  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const now = new Date()
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `fitboddy-analytics-${stamp}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

export function AnalyticsPage() {
  const [goal, setGoal] = useState('all')
  const [level, setLevel] = useState('all')
  const [workoutLocation, setWorkoutLocation] = useState('all')
  const [equipment, setEquipment] = useState('all')

  const filters = useMemo(
    () => ({
      goal: goal === 'all' ? undefined : goal,
      level: level === 'all' ? undefined : level,
      workout_location: workoutLocation === 'all' ? undefined : workoutLocation,
      equipment: equipment === 'all' ? undefined : equipment,
    }),
    [goal, level, workoutLocation, equipment],
  )

  const summaryQ = useQuery({
    queryKey: queryKeys.analytics.workoutSummary(filters),
    queryFn: () => getWorkoutAnalyticsSummary(filters),
    networkMode: 'always' as const,
  })

  const data = summaryQ.data
  const retentionChartData = data?.retention_cohorts
    .slice()
    .reverse()
    .map((item) => ({
      cohort: item.cohort_week,
      d7: toPercentNumber(item.d7_rate),
      d30: toPercentNumber(item.d30_rate),
    })) ?? []
  const funnelChartData = data?.cycle_funnel.map((item) => ({
    step: item.title,
    users: item.users_count,
  })) ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Аналитика тренировок</h2>
          <p className="text-sm text-secondary-foreground/80">
            Сводка retention и качества генерации по всем пользователям.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            if (!data) return
            exportAnalyticsCsv(data, filters)
          }}
          disabled={!data}
        >
          <Download className="h-4 w-4" />
          Экспорт CSV
        </Button>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            value={goal}
            onValueChange={setGoal}
            options={[
              { value: 'all', label: 'Goal: все' },
              { value: 'weight_loss', label: 'Похудение' },
              { value: 'muscle_gain', label: 'Набор массы' },
              { value: 'maintenance', label: 'Поддержание' },
              { value: 'endurance', label: 'Выносливость' },
              { value: 'rehabilitation', label: 'Реабилитация' },
            ]}
          />
          <Select
            value={level}
            onValueChange={setLevel}
            options={[
              { value: 'all', label: 'Уровень: все' },
              { value: 'beginner', label: 'Новичок' },
              { value: 'intermediate', label: 'Средний' },
              { value: 'advanced', label: 'Продвинутый' },
            ]}
          />
          <Select
            value={workoutLocation}
            onValueChange={setWorkoutLocation}
            options={[
              { value: 'all', label: 'Локация: все' },
              { value: 'home', label: 'Дом' },
              { value: 'gym', label: 'Зал' },
              { value: 'both', label: 'Дом и зал' },
            ]}
          />
          <Select
            value={equipment}
            onValueChange={setEquipment}
            options={[
              { value: 'all', label: 'Инвентарь: любой' },
              { value: 'none', label: 'Без инвентаря' },
              { value: 'dumbbells', label: 'Гантели' },
              { value: 'barbell', label: 'Штанга' },
              { value: 'resistance_bands', label: 'Резинки' },
              { value: 'kettlebell', label: 'Гиря' },
              { value: 'treadmill', label: 'Дорожка' },
            ]}
          />
        </CardContent>
      </Card>

      {summaryQ.isLoading ? (
        <Card><CardContent className="p-4 text-sm text-secondary-foreground/80">Загрузка...</CardContent></Card>
      ) : summaryQ.isError || !data ? (
        <Card><CardContent className="p-4 text-sm text-destructive">Не удалось загрузить аналитику.</CardContent></Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card><CardContent className="space-y-1 p-4"><div className="flex items-center gap-2 text-xs text-secondary-foreground/70"><Users className="h-4 w-4" />Пользователи</div><div className="text-2xl font-semibold tabular-nums">{data.users_total}</div></CardContent></Card>
            <Card><CardContent className="space-y-1 p-4"><div className="flex items-center gap-2 text-xs text-secondary-foreground/70"><Target className="h-4 w-4" />Профиль заполнен</div><div className="text-2xl font-semibold tabular-nums">{percent(data.users_total > 0 ? data.users_with_profile / data.users_total : 0)}</div></CardContent></Card>
            <Card><CardContent className="space-y-1 p-4"><div className="flex items-center gap-2 text-xs text-secondary-foreground/70"><Repeat className="h-4 w-4" />Пользователи 2+ циклов</div><div className="text-2xl font-semibold tabular-nums">{data.users_with_2_cycles}</div></CardContent></Card>
            <Card><CardContent className="space-y-1 p-4"><div className="flex items-center gap-2 text-xs text-secondary-foreground/70"><CalendarClock className="h-4 w-4" />Планы за 30 дней</div><div className="text-2xl font-semibold tabular-nums">{data.plans_generated_last_30_days}</div></CardContent></Card>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <Card>
              <CardContent className="space-y-4 p-4">
                <div className="flex items-center gap-2 text-sm font-medium"><ChartLine className="h-4 w-4 text-primary" />Retention</div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm"><span>D7</span><Badge variant="muted">{percent(data.d7_retention_rate)}</Badge></div>
                    <ProgressBar value={data.d7_retention_rate} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm"><span>D30</span><Badge variant="muted">{percent(data.d30_retention_rate)}</Badge></div>
                    <ProgressBar value={data.d30_retention_rate} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 p-4">
                <div className="flex items-center gap-2 text-sm font-medium"><TrendingUp className="h-4 w-4 text-primary" />Качество цикла</div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm"><span>Completion rate</span><Badge variant="muted">{percent(data.avg_cycle_completion_rate)}</Badge></div>
                    <ProgressBar value={data.avg_cycle_completion_rate} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm"><span>Adherence score</span><Badge variant="muted">{percent(data.avg_adherence_score)}</Badge></div>
                    <ProgressBar value={data.avg_adherence_score} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm"><span>Novelty ratio</span><Badge variant="muted">{percent(data.avg_novelty_ratio)}</Badge></div>
                    <ProgressBar value={data.avg_novelty_ratio} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <Card>
              <CardContent className="space-y-2 p-4">
                <div className="text-sm font-medium">Генерация планов: неделя к неделе</div>
                <div className="flex items-center justify-between text-sm">
                  <span>Текущая неделя</span>
                  <Badge variant="muted">{data.plans_generated_this_week}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Предыдущая неделя</span>
                  <Badge variant="muted">{data.plans_generated_prev_week}</Badge>
                </div>
                <div className="text-xs text-secondary-foreground/75">
                  Delta: {data.plans_generated_this_week - data.plans_generated_prev_week}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-2 p-4">
                <div className="text-sm font-medium">Завершенные тренировки: неделя к неделе</div>
                <div className="flex items-center justify-between text-sm">
                  <span>Текущая неделя</span>
                  <Badge variant="muted">{data.workouts_completed_this_week}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Предыдущая неделя</span>
                  <Badge variant="muted">{data.workouts_completed_prev_week}</Badge>
                </div>
                <div className="text-xs text-secondary-foreground/75">
                  Delta: {data.workouts_completed_this_week - data.workouts_completed_prev_week}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <Card>
              <CardContent className="space-y-3 p-4">
                <div className="text-sm font-medium">Retention trend (кохорты)</div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={retentionChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border-rgb) / 0.5)" />
                      <XAxis dataKey="cohort" tick={{ fill: 'rgb(var(--secondary-foreground-rgb))', fontSize: 11 }} />
                      <YAxis tickFormatter={(v) => `${v}%`} tick={{ fill: 'rgb(var(--secondary-foreground-rgb))', fontSize: 11 }} />
                      <Tooltip
                        formatter={(value) => `${Number(value ?? 0)}%`}
                        contentStyle={{
                          background: 'var(--surface-popover)',
                          border: '1px solid rgb(var(--border-rgb) / 0.6)',
                          borderRadius: '10px',
                        }}
                      />
                      <Line type="monotone" dataKey="d7" name="D7" stroke="rgb(var(--accent-rgb))" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="d30" name="D30" stroke="rgb(var(--warning-rgb))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-3 p-4">
                <div className="text-sm font-medium">Воронка по пользователям</div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelChartData} layout="vertical" margin={{ left: 24, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border-rgb) / 0.5)" />
                      <XAxis type="number" tick={{ fill: 'rgb(var(--secondary-foreground-rgb))', fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="step"
                        tick={{ fill: 'rgb(var(--secondary-foreground-rgb))', fontSize: 11 }}
                        width={160}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--surface-popover)',
                          border: '1px solid rgb(var(--border-rgb) / 0.6)',
                          borderRadius: '10px',
                        }}
                      />
                      <Bar dataKey="users" fill="rgb(var(--accent-rgb) / 0.9)" radius={[0, 6, 6, 0]}>
                        <LabelList dataKey="users" position="right" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center gap-2 text-sm font-medium"><Activity className="h-4 w-4 text-primary" />Оперативные сигналы</div>
              <div className="text-sm text-secondary-foreground/85">
                Завершенных тренировок за 7 дней: <span className="font-semibold">{data.workouts_completed_last_7_days}</span>
              </div>
              <div className="text-xs text-secondary-foreground/70">
                Это метрики по фактической активности пользователей. Используй их как базу для weekly nudges и оценки качества генерации.
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3 lg:grid-cols-2">
            <Card>
              <CardContent className="space-y-3 p-4">
                <div className="text-sm font-medium">Когорты retention (по неделям регистрации)</div>
                {data.retention_cohorts.length === 0 ? (
                  <div className="text-sm text-secondary-foreground/80">Пока недостаточно данных.</div>
                ) : (
                  <div className="space-y-2">
                    {data.retention_cohorts.map((cohort) => (
                      <div key={cohort.cohort_week} className="rounded-md border border-border p-3">
                        <div className="mb-1 flex items-center justify-between">
                          <div className="text-sm font-medium">{cohort.cohort_week}</div>
                          <Badge variant="muted">{cohort.users_count} users</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <div className="text-xs text-secondary-foreground/70">D7</div>
                            <ProgressBar value={cohort.d7_rate} />
                            <div className="text-xs">{percent(cohort.d7_rate)}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-secondary-foreground/70">D30</div>
                            <ProgressBar value={cohort.d30_rate} />
                            <div className="text-xs">{percent(cohort.d30_rate)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3 p-4">
                <div className="text-sm font-medium">Воронка цикла</div>
                <div className="space-y-2">
                  {data.cycle_funnel.map((step, idx) => (
                    <div key={step.step_key} className="rounded-md border border-border p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">{idx + 1}. {step.title}</div>
                        <Badge variant="muted">{step.users_count}</Badge>
                      </div>
                      <div className="mt-1 text-xs text-secondary-foreground/75">
                        Конверсия от предыдущего шага: {conversionLabel(step.conversion_from_prev)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="text-sm font-medium">Алерты качества</div>
              {data.alerts.length === 0 ? (
                <div className="text-sm text-secondary-foreground/75">Критичных сигналов нет.</div>
              ) : (
                <div className="space-y-2">
                  {data.alerts.map((alert) => (
                    <div key={alert.code} className="rounded-md border border-border p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">{alert.title}</div>
                        <Badge variant={alert.severity === 'critical' ? 'warning' : 'muted'}>
                          {alert.severity}
                        </Badge>
                      </div>
                      <div className="mt-1 text-xs text-secondary-foreground/75">{alert.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

