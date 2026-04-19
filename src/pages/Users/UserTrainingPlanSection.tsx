import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronUp, Dumbbell, ListTree, Pencil, Save } from 'lucide-react'

import {
  getActiveTrainingPlan,
  getUserTrainingPlan,
  listExercises,
  listUserTrainingPlans,
  queryKeys,
  replaceSessionExercises,
  updateScheduledWorkout,
  updateUserTrainingPlan,
} from '../../api'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { CollapsibleSection } from '../../components/ui/collapsible-section'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Input } from '../../components/ui/input'
import { SelectField } from '../../components/ui/select'
import { cn } from '../../lib/utils'
import type { ExerciseOut } from '../../types/exercise'
import type {
  ReplaceSessionExercisesIn,
  ScheduledWorkoutExerciseOut,
  ScheduledWorkoutOut,
  SessionExerciseLineIn,
  TrainingPlanStatus,
} from '../../types/trainingPlan'

const STATUS_OPTIONS: { value: TrainingPlanStatus; label: string }[] = [
  { value: 'active', label: 'Активен' },
  { value: 'archived', label: 'Архив' },
  { value: 'cancelled', label: 'Отменён' },
]

const EFFORT_UNSET = '_unset'

const EFFORT_OPTIONS = [
  { value: EFFORT_UNSET, label: '— не задано —' },
  { value: 'easy', label: 'Легко' },
  { value: 'ok', label: 'Нормально' },
  { value: 'hard', label: 'Тяжело' },
]

function statusLabel(s: TrainingPlanStatus) {
  return STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s
}

type RowDraft = {
  scheduled_for: string
  week: string
  day_of_week: string
  volume_multiplier: string
  is_completed: boolean
  perceived_effort: string
}

function sortedSessionExercises(w: ScheduledWorkoutOut): ScheduledWorkoutExerciseOut[] {
  return [...w.session_exercises].sort((a, b) => a.sort_order - b.sort_order)
}

function workoutExercisesPreview(w: ScheduledWorkoutOut): string {
  const items = sortedSessionExercises(w)
  if (items.length === 0) return 'Упражнений нет'
  return items
    .slice(0, 4)
    .map((se) => se.exercise.name)
    .join(' · ')
    .concat(items.length > 4 ? ` … +${items.length - 4}` : '')
}

function formatSetsReps(se: ScheduledWorkoutExerciseOut): string {
  if (se.sets != null && se.reps != null) return `${se.sets}×${se.reps}`
  if (se.duration_seconds != null) return `${se.duration_seconds} с`
  if (se.sets != null) return `${se.sets} подх.`
  if (se.reps != null) return `${se.reps} повт.`
  return '—'
}

function workoutToDraft(w: ScheduledWorkoutOut): RowDraft {
  return {
    scheduled_for: w.scheduled_for.slice(0, 10),
    week: w.week === null || w.week === undefined ? '' : String(w.week),
    day_of_week: w.day_of_week === null || w.day_of_week === undefined ? '' : String(w.day_of_week),
    volume_multiplier: String(w.volume_multiplier),
    is_completed: w.is_completed,
    perceived_effort: w.perceived_effort ?? EFFORT_UNSET,
  }
}

export function UserTrainingPlanSection({ userId }: { userId: number }) {
  const queryClient = useQueryClient()

  const activeQuery = useQuery({
    queryKey: queryKeys.users.trainingPlanActive(userId),
    queryFn: () => getActiveTrainingPlan(userId),
  })

  const listQuery = useQuery({
    queryKey: queryKeys.users.trainingPlansList(userId),
    queryFn: () => listUserTrainingPlans(userId),
  })

  const defaultPlanId = activeQuery.data?.id ?? listQuery.data?.[0]?.id ?? null
  const [overridePlanId, setOverridePlanId] = useState<number | null>(null)
  const selectedPlanId = overridePlanId ?? defaultPlanId

  const detailQuery = useQuery({
    queryKey:
      selectedPlanId === null
        ? ['users', userId, 'training-plan', 'detail', 'none']
        : queryKeys.users.trainingPlanDetail(userId, selectedPlanId),
    queryFn: async () => {
      if (selectedPlanId === null) throw new Error('no plan')
      return await getUserTrainingPlan(userId, selectedPlanId)
    },
    enabled: selectedPlanId !== null,
  })

  const exercisesQuery = useQuery({
    queryKey: ['exercises', 'catalog', 'training-plan-editor'],
    queryFn: listExercises,
    staleTime: 5 * 60_000,
  })

  const plan = detailQuery.data

  const [meta, setMeta] = useState({
    start_date: '',
    end_date: '',
    status: 'active' as TrainingPlanStatus,
  })

  useEffect(() => {
    if (!plan) return
    setMeta({
      start_date: plan.start_date.slice(0, 10),
      end_date: plan.end_date.slice(0, 10),
      status: plan.status,
    })
  }, [plan?.id, plan?.start_date, plan?.end_date, plan?.status])

  const invalidateTraining = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.users.trainingPlanActive(userId) })
    void queryClient.invalidateQueries({ queryKey: queryKeys.users.trainingPlansList(userId) })
    if (selectedPlanId !== null) {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.users.trainingPlanDetail(userId, selectedPlanId),
      })
    }
  }, [queryClient, userId, selectedPlanId])

  const updatePlanMutation = useMutation({
    mutationFn: async () => {
      if (!plan) throw new Error('no plan')
      return await updateUserTrainingPlan(userId, plan.id, {
        start_date: meta.start_date,
        end_date: meta.end_date,
        status: meta.status,
      })
    },
    onSuccess: () => invalidateTraining(),
  })

  const updateWorkoutMutation = useMutation({
    mutationFn: async ({
      scheduledId,
      payload,
    }: {
      scheduledId: number
      payload: Parameters<typeof updateScheduledWorkout>[2]
    }) => await updateScheduledWorkout(userId, scheduledId, payload),
    onSuccess: () => invalidateTraining(),
  })

  const [rowDrafts, setRowDrafts] = useState<Record<number, RowDraft>>({})

  const workoutsFingerprint = useMemo(() => {
    if (!plan) return ''
    return plan.scheduled_workouts
      .map((w) => `${w.id}:${w.scheduled_for}:${w.is_completed}:${w.volume_multiplier}:${w.perceived_effort ?? ''}`)
      .join('|')
  }, [plan])

  useEffect(() => {
    if (!plan) {
      setRowDrafts({})
      return
    }
    const next: Record<number, RowDraft> = {}
    for (const w of plan.scheduled_workouts) {
      next[w.id] = workoutToDraft(w)
    }
    setRowDrafts(next)
  }, [plan, workoutsFingerprint])

  const workouts = useMemo(() => {
    if (!plan) return []
    return [...plan.scheduled_workouts].sort((a, b) => a.scheduled_for.localeCompare(b.scheduled_for))
  }, [plan])

  const exerciseOptions = useMemo(() => {
    const list = exercisesQuery.data ?? []
    return list.map((e: ExerciseOut) => ({
      value: String(e.id),
      label: `${e.id} — ${e.name}`,
    }))
  }, [exercisesQuery.data])

  const firstExerciseId = exercisesQuery.data?.[0]?.id ?? 0

  const [sessionDialog, setSessionDialog] = useState<{
    open: boolean
    workout: ScheduledWorkoutOut | null
    lines: SessionExerciseLineIn[]
  }>({ open: false, workout: null, lines: [] })

  const openSessionEditor = (w: ScheduledWorkoutOut) => {
    const sorted = sortedSessionExercises(w)
    const lines: SessionExerciseLineIn[] = sorted.map((se, idx) => ({
      exercise_id: se.exercise_id,
      sort_order: idx,
      sets: se.sets,
      reps: se.reps,
      duration_seconds: se.duration_seconds,
      rest_seconds: se.rest_seconds,
    }))
    const fallbackLine: SessionExerciseLineIn = {
      exercise_id: firstExerciseId,
      sort_order: 0,
      sets: 3,
      reps: 12,
      duration_seconds: null,
      rest_seconds: 60,
    }
    setSessionDialog({
      open: true,
      workout: w,
      lines: lines.length > 0 ? lines : firstExerciseId ? [fallbackLine] : [],
    })
  }

  const replaceSessionMutation = useMutation({
    mutationFn: async (payload: { scheduledId: number; body: ReplaceSessionExercisesIn }) =>
      await replaceSessionExercises(userId, payload.scheduledId, payload.body),
    onSuccess: () => {
      invalidateTraining()
      setSessionDialog({ open: false, workout: null, lines: [] })
    },
  })

  const planSelectOptions = useMemo(() => {
    const rows = listQuery.data ?? []
    return rows.map((p) => ({
      value: String(p.id),
      label: `#${p.id} ${p.start_date.slice(0, 10)} → ${p.end_date.slice(0, 10)} · ${statusLabel(p.status)}`,
    }))
  }, [listQuery.data])

  const isLoading = activeQuery.isLoading || listQuery.isLoading
  const hasAnyPlan = (listQuery.data?.length ?? 0) > 0 || activeQuery.data != null

  const [dayOpen, setDayOpen] = useState<Record<number, boolean>>({})

  useEffect(() => {
    setDayOpen({})
  }, [plan?.id])

  const toggleDay = useCallback((id: number) => {
    setDayOpen((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const expandAllDays = useCallback(() => {
    const next: Record<number, boolean> = {}
    for (const w of workouts) {
      next[w.id] = true
    }
    setDayOpen(next)
  }, [workouts])

  const collapseAllDays = useCallback(() => {
    setDayOpen({})
  }, [])

  const [mainOpen, setMainOpen] = useState(true)

  return (
    <Card style={{ backgroundColor: 'var(--surface-section)' }}>
      <CardContent className="space-y-4 p-5">
        <button
          type="button"
          className="flex w-full flex-wrap items-center justify-between gap-2 rounded-lg px-1 py-0.5 text-left transition-colors hover:bg-secondary/50"
          onClick={() => setMainOpen((o) => !o)}
          aria-expanded={mainOpen}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 text-secondary-foreground/70 transition-transform',
                mainOpen && 'rotate-180',
              )}
            />
            <Dumbbell className="h-4 w-4 shrink-0 text-secondary-foreground/80" />
            <div className="min-w-0">
              <div className="text-sm font-medium text-foreground">План тренировок</div>
              <div className="text-xs text-secondary-foreground/70">
                {mainOpen ? 'Нажмите, чтобы свернуть блок' : 'Нажмите, чтобы развернуть'}
              </div>
            </div>
          </div>
          {activeQuery.data ? (
            <Badge variant="primary">активный #{activeQuery.data.id}</Badge>
          ) : (
            <Badge variant="muted">нет активного</Badge>
          )}
        </button>

        {mainOpen && isLoading ? (
          <div className="text-sm text-secondary-foreground/80">Загрузка планов…</div>
        ) : mainOpen && !hasAnyPlan ? (
          <div className="rounded-lg border border-border/70 bg-secondary p-3 text-sm text-secondary-foreground/80">
            У пользователя пока нет планов тренировок.
          </div>
        ) : mainOpen ? (
          <div className="space-y-3">
            <CollapsibleSection
              title="План и выбор"
              subtitle={
                selectedPlanId === null
                  ? 'Выберите план из списка'
                  : `Сейчас открыт план #${selectedPlanId}`
              }
              defaultOpen
            >
              {planSelectOptions.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-xs font-medium tracking-wide text-secondary-foreground/80">
                    АКТИВНЫЙ / ИСТОРИЯ
                  </div>
                  <SelectField
                    value={selectedPlanId === null ? '' : String(selectedPlanId)}
                    onValueChange={(v) => setOverridePlanId(Number(v))}
                    options={planSelectOptions}
                    placeholder="План"
                  />
                </div>
              ) : null}

              {detailQuery.isLoading && (
                <div className="text-sm text-secondary-foreground/80">Загрузка выбранного плана…</div>
              )}

              {detailQuery.isError && (
                <div className="text-sm text-destructive">
                  Не удалось загрузить план. Проверь id и права.
                </div>
              )}
            </CollapsibleSection>

            {plan && (
              <>
                <CollapsibleSection
                  key={`plan-meta-${plan.id}`}
                  title="Параметры плана"
                  subtitle={`${plan.start_date.slice(0, 10)} — ${plan.end_date.slice(0, 10)} · ${statusLabel(plan.status)} · #${plan.id}`}
                  defaultOpen={false}
                >
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <div className="text-xs text-secondary-foreground/70">Начало</div>
                      <Input
                        type="date"
                        value={meta.start_date}
                        onChange={(e) => setMeta((m) => ({ ...m, start_date: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-secondary-foreground/70">Окончание</div>
                      <Input
                        type="date"
                        value={meta.end_date}
                        onChange={(e) => setMeta((m) => ({ ...m, end_date: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <div className="text-xs text-secondary-foreground/70">Статус</div>
                      <SelectField
                        value={meta.status}
                        onValueChange={(v) => setMeta((m) => ({ ...m, status: v as TrainingPlanStatus }))}
                        options={STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => updatePlanMutation.mutate()}
                      disabled={updatePlanMutation.isPending}
                    >
                      <Save className="mr-2 h-3.5 w-3.5" />
                      Сохранить план
                    </Button>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection
                  key={`plan-days-${plan.id}`}
                  title="Тренировки по дням"
                  subtitle={`${workouts.length} дней в плане — нажмите день, чтобы увидеть упражнения и правки`}
                  defaultOpen
                  headerActions={
                    workouts.length > 0 ? (
                      <>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="h-8 shrink-0 px-2 text-xs"
                          onClick={expandAllDays}
                        >
                          Развернуть все
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="h-8 shrink-0 px-2 text-xs"
                          onClick={collapseAllDays}
                        >
                          Свернуть все
                        </Button>
                      </>
                    ) : null
                  }
                >
                  <div className="space-y-2">
                    {workouts.map((w) => {
                      const draft = rowDrafts[w.id] ?? workoutToDraft(w)
                      const expanded = Boolean(dayOpen[w.id])
                      const lines = sortedSessionExercises(w)
                      return (
                        <div
                          key={w.id}
                          className="overflow-hidden rounded-2xl border border-border/60 bg-card/30"
                          style={{ backgroundColor: 'var(--surface-control)' }}
                        >
                          <button
                            type="button"
                            className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/50"
                            onClick={() => toggleDay(w.id)}
                            aria-expanded={expanded}
                          >
                            <ChevronDown
                              className={cn(
                                'mt-0.5 h-4 w-4 shrink-0 text-secondary-foreground/70 transition-transform',
                                expanded && 'rotate-180',
                              )}
                            />
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-medium text-foreground">
                                  {w.scheduled_for.slice(0, 10)}
                                </span>
                                <Badge variant="muted">id {w.id}</Badge>
                                {w.is_completed ? (
                                  <Badge variant="primary">выполнено</Badge>
                                ) : (
                                  <Badge variant="muted">не выполнено</Badge>
                                )}
                                <Badge variant="default">{lines.length} упр.</Badge>
                              </div>
                              {!expanded ? (
                                <div className="line-clamp-2 text-xs text-secondary-foreground/80">
                                  {workoutExercisesPreview(w)}
                                </div>
                              ) : null}
                            </div>
                          </button>

                          {expanded ? (
                            <div className="space-y-3 border-t border-border/40 px-4 pb-4 pt-3">
                              <div className="rounded-xl border border-border/50 bg-secondary/80 p-3">
                                <div className="mb-2 flex items-center gap-2 text-xs font-medium tracking-wide text-secondary-foreground/80">
                                  <ListTree className="h-3.5 w-3.5" />
                                  Упражнения в этот день
                                </div>
                                {lines.length === 0 ? (
                                  <div className="text-sm text-secondary-foreground/80">
                                    В этот день упражнений нет — задайте состав кнопкой ниже.
                                  </div>
                                ) : (
                                  <ol className="list-decimal space-y-2 pl-4 text-sm text-foreground">
                                    {lines.map((se) => (
                                      <li key={se.id} className="pl-1">
                                        <span className="font-medium">{se.exercise.name}</span>
                                        <span className="text-secondary-foreground/80">
                                          {' '}
                                          · {formatSetsReps(se)}
                                          {se.rest_seconds != null ? ` · отдых ${se.rest_seconds} с` : ''}
                                        </span>
                                      </li>
                                    ))}
                                  </ol>
                                )}
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <Button type="button" variant="secondary" size="sm" onClick={() => openSessionEditor(w)}>
                                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                                  Изменить состав
                                </Button>
                              </div>

                              <CollapsibleSection
                                title="Параметры дня"
                                subtitle="Дата в плане, множитель, отметка о выполнении"
                                defaultOpen={false}
                                className="border-border/50 bg-secondary/40"
                              >
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                  <div className="space-y-1">
                                    <div className="text-xs text-secondary-foreground/70">Дата</div>
                                    <Input
                                      type="date"
                                      value={draft.scheduled_for}
                                      onChange={(e) =>
                                        setRowDrafts((d) => ({
                                          ...d,
                                          [w.id]: { ...draft, scheduled_for: e.target.value },
                                        }))
                                      }
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <div className="text-xs text-secondary-foreground/70">Неделя</div>
                                    <Input
                                      inputMode="numeric"
                                      value={draft.week}
                                      onChange={(e) =>
                                        setRowDrafts((d) => ({ ...d, [w.id]: { ...draft, week: e.target.value } }))
                                      }
                                      placeholder="опц."
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <div className="text-xs text-secondary-foreground/70">День недели (0–6)</div>
                                    <Input
                                      inputMode="numeric"
                                      value={draft.day_of_week}
                                      onChange={(e) =>
                                        setRowDrafts((d) => ({
                                          ...d,
                                          [w.id]: { ...draft, day_of_week: e.target.value },
                                        }))
                                      }
                                      placeholder="опц."
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <div className="text-xs text-secondary-foreground/70">Множитель объёма</div>
                                    <Input
                                      inputMode="decimal"
                                      value={draft.volume_multiplier}
                                      onChange={(e) =>
                                        setRowDrafts((d) => ({
                                          ...d,
                                          [w.id]: { ...draft, volume_multiplier: e.target.value },
                                        }))
                                      }
                                    />
                                  </div>
                                  <div className="space-y-1 sm:col-span-2">
                                    <div className="text-xs text-secondary-foreground/70">Субъективная нагрузка</div>
                                    <SelectField
                                      value={draft.perceived_effort}
                                      onValueChange={(v) =>
                                        setRowDrafts((d) => ({ ...d, [w.id]: { ...draft, perceived_effort: v } }))
                                      }
                                      options={EFFORT_OPTIONS}
                                    />
                                  </div>
                                  <label className="flex items-center gap-2 text-sm sm:col-span-2 lg:col-span-3">
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4 rounded border-border accent-primary"
                                      checked={draft.is_completed}
                                      onChange={(e) =>
                                        setRowDrafts((d) => ({
                                          ...d,
                                          [w.id]: { ...draft, is_completed: e.target.checked },
                                        }))
                                      }
                                    />
                                    Выполнено
                                  </label>
                                </div>
                                <div className="mt-4">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="default"
                                    disabled={updateWorkoutMutation.isPending}
                                    onClick={() => {
                                      const mult = Number(draft.volume_multiplier.replace(',', '.'))
                                      if (!Number.isFinite(mult) || mult <= 0) {
                                        return
                                      }
                                      const week =
                                        draft.week.trim() === '' ? undefined : Number.parseInt(draft.week, 10)
                                      const dow =
                                        draft.day_of_week.trim() === ''
                                          ? undefined
                                          : Number.parseInt(draft.day_of_week, 10)
                                      updateWorkoutMutation.mutate({
                                        scheduledId: w.id,
                                        payload: {
                                          scheduled_for: draft.scheduled_for,
                                          week: Number.isFinite(week) ? week : undefined,
                                          day_of_week: Number.isFinite(dow) ? dow : undefined,
                                          volume_multiplier: mult,
                                          is_completed: draft.is_completed,
                                          perceived_effort:
                                            draft.perceived_effort === EFFORT_UNSET
                                              ? ''
                                              : draft.perceived_effort || null,
                                        },
                                      })
                                    }}
                                  >
                                    <Save className="mr-2 h-3.5 w-3.5" />
                                    Сохранить параметры дня
                                  </Button>
                                </div>
                              </CollapsibleSection>
                            </div>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                </CollapsibleSection>
              </>
            )}
          </div>
        ) : null}

        <Dialog
          open={sessionDialog.open}
          onOpenChange={(open) => {
            if (!open) setSessionDialog({ open: false, workout: null, lines: [] })
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Состав тренировки</DialogTitle>
            </DialogHeader>
            {sessionDialog.workout && (
              <div className="space-y-3 text-sm">
                <div className="text-secondary-foreground/80">
                  Дата: {sessionDialog.workout.scheduled_for.slice(0, 10)} · id {sessionDialog.workout.id}
                </div>
                {exercisesQuery.isLoading ? (
                  <div className="text-secondary-foreground/80">Загрузка каталога упражнений…</div>
                ) : (
                  <div className="space-y-3">
                    {sessionDialog.lines.map((line, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-1 gap-2 rounded-xl border border-border/50 p-3 sm:grid-cols-12"
                      >
                        <div className="sm:col-span-5 space-y-1">
                          <div className="text-xs text-secondary-foreground/70">Упражнение</div>
                          <SelectField
                            value={line.exercise_id ? String(line.exercise_id) : ''}
                            onValueChange={(v) => {
                              const id = Number(v)
                              setSessionDialog((s) => {
                                const lines = [...s.lines]
                                lines[idx] = { ...lines[idx], exercise_id: id }
                                return { ...s, lines }
                              })
                            }}
                            options={exerciseOptions}
                            placeholder="Выберите"
                          />
                        </div>
                        <div className="sm:col-span-2 space-y-1">
                          <div className="text-xs text-secondary-foreground/70">Подходы</div>
                          <Input
                            inputMode="numeric"
                            value={line.sets === null || line.sets === undefined ? '' : String(line.sets)}
                            onChange={(e) => {
                              const raw = e.target.value
                              setSessionDialog((s) => {
                                const lines = [...s.lines]
                                lines[idx] = {
                                  ...lines[idx],
                                  sets: raw === '' ? null : Number.parseInt(raw, 10),
                                }
                                return { ...s, lines }
                              })
                            }}
                          />
                        </div>
                        <div className="sm:col-span-2 space-y-1">
                          <div className="text-xs text-secondary-foreground/70">Повторы</div>
                          <Input
                            inputMode="numeric"
                            value={line.reps === null || line.reps === undefined ? '' : String(line.reps)}
                            onChange={(e) => {
                              const raw = e.target.value
                              setSessionDialog((s) => {
                                const lines = [...s.lines]
                                lines[idx] = {
                                  ...lines[idx],
                                  reps: raw === '' ? null : Number.parseInt(raw, 10),
                                }
                                return { ...s, lines }
                              })
                            }}
                          />
                        </div>
                        <div className="sm:col-span-3 flex items-end gap-1">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="shrink-0"
                            disabled={idx === 0}
                            onClick={() =>
                              setSessionDialog((s) => {
                                const lines = [...s.lines]
                                if (idx === 0) return s
                                ;[lines[idx - 1], lines[idx]] = [lines[idx], lines[idx - 1]]
                                return { ...s, lines: lines.map((L, i) => ({ ...L, sort_order: i })) }
                              })
                            }
                            aria-label="Вверх"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="shrink-0"
                            disabled={idx >= sessionDialog.lines.length - 1}
                            onClick={() =>
                              setSessionDialog((s) => {
                                const lines = [...s.lines]
                                if (idx >= lines.length - 1) return s
                                ;[lines[idx + 1], lines[idx]] = [lines[idx], lines[idx + 1]]
                                return { ...s, lines: lines.map((L, i) => ({ ...L, sort_order: i })) }
                              })
                            }
                            aria-label="Вниз"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="ml-auto"
                            disabled={sessionDialog.lines.length <= 1}
                            onClick={() =>
                              setSessionDialog((s) => ({
                                ...s,
                                lines: s.lines
                                  .filter((_, i) => i !== idx)
                                  .map((L, i) => ({ ...L, sort_order: i })),
                              }))
                            }
                          >
                            Удалить
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setSessionDialog((s) => ({
                          ...s,
                          lines: [
                            ...s.lines,
                            {
                              exercise_id: firstExerciseId,
                              sort_order: s.lines.length,
                              sets: 3,
                              reps: 12,
                              duration_seconds: null,
                              rest_seconds: 60,
                            },
                          ],
                        }))
                      }
                    >
                      Добавить строку
                    </Button>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSessionDialog({ open: false, workout: null, lines: [] })}
              >
                Отмена
              </Button>
              <Button
                type="button"
                disabled={
                  replaceSessionMutation.isPending ||
                  !sessionDialog.workout ||
                  sessionDialog.lines.some((l) => !l.exercise_id)
                }
                onClick={() => {
                  if (!sessionDialog.workout) return
                  const body: ReplaceSessionExercisesIn = {
                    exercises: sessionDialog.lines.map((l, i) => ({
                      ...l,
                      sort_order: i,
                    })),
                  }
                  replaceSessionMutation.mutate({
                    scheduledId: sessionDialog.workout.id,
                    body,
                  })
                }}
              >
                Сохранить состав
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
