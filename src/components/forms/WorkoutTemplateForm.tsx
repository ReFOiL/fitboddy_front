import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

import { listExercises, queryKeys } from '../../api'
import type { WorkoutDifficulty, WorkoutTemplateCreate } from '../../types/workout'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Input } from '../ui/input'
import { NumberInput } from '../ui/number-input'
import { Select } from '../ui/select'

const nullableInt = z.preprocess(
  (v) => {
    if (v === '' || v === null || v === undefined) return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  },
  z.number().int().nullable()
)

const exerciseRowSchema = z.object({
  exercise_id: z.coerce.number().int().min(0),
  sort_order: z.coerce.number().int().min(0).default(0),
  sets: nullableInt.optional(),
  reps: nullableInt.optional(),
  duration_seconds: nullableInt.optional(),
  rest_seconds: nullableInt.optional(),
  notes: z.preprocess((v) => (v === '' || v == null ? null : String(v)), z.string().max(500).nullable()).optional(),
})

const formSchema = z.object({
  title: z.string().min(1, 'Введите название').max(128),
  goal: z.string().min(1, 'Введите цель').max(32),
  difficulty: z.enum(['low', 'medium', 'high'] as const),
  equipment: z.preprocess((v) => (v === '' || v == null ? null : String(v)), z.string().max(128).nullable()).optional(),
  days_per_week: z.coerce.number().int().min(1).max(7).default(3),
  description: z.preprocess((v) => (v === '' || v == null ? null : String(v)), z.string().max(1000).nullable()).optional(),
  is_active: z.coerce.boolean().default(true),
  exercises: z.array(exerciseRowSchema).default([]),
})

type FormData = z.output<typeof formSchema>

export type WorkoutTemplateFormValues = WorkoutTemplateCreate

export function WorkoutTemplateForm(props: {
  mode: 'create' | 'edit'
  defaultValues?: Partial<WorkoutTemplateCreate>
  isSubmitting?: boolean
  onSubmit: (values: WorkoutTemplateFormValues) => Promise<void>
}) {
  const exercisesQuery = useQuery({
    queryKey: queryKeys.exercises.all,
    queryFn: listExercises,
    networkMode: 'always',
  })

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema) as unknown as Resolver<FormData>,
    defaultValues: {
      title: props.defaultValues?.title ?? '',
      goal: props.defaultValues?.goal ?? '',
      difficulty: (props.defaultValues?.difficulty ?? 'medium') as WorkoutDifficulty,
      equipment: props.defaultValues?.equipment ?? null,
      days_per_week: props.defaultValues?.days_per_week ?? 3,
      description: props.defaultValues?.description ?? null,
      is_active: props.defaultValues?.is_active ?? true,
      exercises:
        props.defaultValues?.exercises?.map((e, i) => ({
          exercise_id: e.exercise_id,
          sort_order: e.sort_order ?? i,
          sets: e.sets ?? null,
          reps: e.reps ?? null,
          duration_seconds: e.duration_seconds ?? null,
          rest_seconds: e.rest_seconds ?? null,
          notes: e.notes ?? null,
        })) ?? [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'exercises',
  })

  const exerciseOptions = [
    { value: '0', label: '— выбери упражнение —' },
    ...(exercisesQuery.data ?? []).map((e) => ({
      value: String(e.id),
      label: e.name,
    })),
  ]

  return (
    <form
      className="grid gap-4 lg:grid-cols-2"
      onSubmit={form.handleSubmit(async (raw) => {
        const toNum = (v: unknown): number | null => {
          if (v == null || v === '') return null
          const n = Number(v)
          return Number.isFinite(n) ? n : null
        }
        const exercises = raw.exercises
          .filter((e) => e.exercise_id > 0)
          .map((e, i) => ({
            exercise_id: e.exercise_id,
            sort_order: e.sort_order ?? i,
            sets: toNum(e.sets),
            reps: toNum(e.reps),
            duration_seconds: toNum(e.duration_seconds),
            rest_seconds: toNum(e.rest_seconds),
            notes: e.notes ?? null,
          }))
        const values: WorkoutTemplateFormValues = {
          title: raw.title.trim(),
          goal: raw.goal.trim(),
          difficulty: raw.difficulty,
          equipment: raw.equipment ?? null,
          days_per_week: raw.days_per_week,
          description: raw.description ?? null,
          is_active: raw.is_active,
          exercises,
        }
        await props.onSubmit(values)
      })}
    >
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="space-y-1">
            <label className="text-sm">Название</label>
            <Input {...form.register('title')} placeholder="Например: Силовая 3 раза" />
            {form.formState.errors.title?.message ? (
              <div className="text-sm text-destructive">{form.formState.errors.title.message}</div>
            ) : null}
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm">Цель</label>
              <Input {...form.register('goal')} placeholder="Например: strength" />
              {form.formState.errors.goal?.message ? (
                <div className="text-sm text-destructive">{form.formState.errors.goal.message}</div>
              ) : null}
            </div>
            <div className="space-y-1">
              <label className="text-sm">Сложность</label>
              <Select
                value={form.watch('difficulty')}
                onValueChange={(v) =>
                  form.setValue('difficulty', v as WorkoutDifficulty, { shouldDirty: true })
                }
                options={[
                  { value: 'low', label: 'Лёгкая' },
                  { value: 'medium', label: 'Средняя' },
                  { value: 'high', label: 'Высокая' },
                ]}
              />
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm">Оборудование</label>
              <Input {...form.register('equipment')} placeholder="гантели, штанга…" />
            </div>
            <div className="space-y-1">
              <label className="text-sm">Дней в неделю</label>
              <Input
                type="number"
                min={1}
                max={7}
                {...form.register('days_per_week')}
              />
              {form.formState.errors.days_per_week?.message ? (
                <div className="text-sm text-destructive">{form.formState.errors.days_per_week.message}</div>
              ) : null}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm">Описание</label>
            <textarea
              className="min-h-[80px] w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              {...form.register('description')}
              placeholder="Краткое описание шаблона…"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4" {...form.register('is_active')} />
            Активный шаблон
          </label>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Упражнения в шаблоне</div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  append({
                    exercise_id: 0,
                    sort_order: fields.length,
                    sets: undefined,
                    reps: undefined,
                    duration_seconds: undefined,
                    rest_seconds: undefined,
                    notes: null,
                  })
                }
                disabled={exerciseOptions.length === 0}
              >
                Добавить упражнение
              </Button>
            </div>
            {exercisesQuery.isLoading && (
              <div className="text-xs text-secondary-foreground/80">Загрузка списка упражнений…</div>
            )}
            <div className="space-y-2">
              {fields.map((f, idx) => (
                <Card key={f.id} className="border-border/60 bg-secondary/10 p-3">
                  <div className="space-y-3">
                    {/* Строка 1: упражнение */}
                    <div className="space-y-1">
                      <div className="text-xs text-secondary-foreground/75">Упражнение</div>
                      <Select
                        value={String(form.watch(`exercises.${idx}.exercise_id`) ?? '')}
                        onValueChange={(v) =>
                          form.setValue(`exercises.${idx}.exercise_id`, Number(v), {
                            shouldDirty: true,
                          })
                        }
                        placeholder="Выбери упражнение"
                        options={exerciseOptions}
                      />
                    </div>

                    {/* Строка 2: подходы, повторения, сек, отдых */}
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <div className="space-y-1">
                        <div className="text-xs text-secondary-foreground/75">Подходы</div>
                        <Controller
                          control={form.control}
                          name={`exercises.${idx}.sets`}
                          render={({ field }) => (
                            <NumberInput
                              ref={field.ref}
                              value={field.value ?? ''}
                              onChange={(v) => field.onChange(v)}
                              onBlur={field.onBlur}
                              min={1}
                              placeholder="—"
                            />
                          )}
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-secondary-foreground/75">Повторения</div>
                        <Controller
                          control={form.control}
                          name={`exercises.${idx}.reps`}
                          render={({ field }) => (
                            <NumberInput
                              ref={field.ref}
                              value={field.value ?? ''}
                              onChange={(v) => field.onChange(v)}
                              onBlur={field.onBlur}
                              min={1}
                              placeholder="—"
                            />
                          )}
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-secondary-foreground/75">Сек</div>
                        <Controller
                          control={form.control}
                          name={`exercises.${idx}.duration_seconds`}
                          render={({ field }) => (
                            <NumberInput
                              ref={field.ref}
                              value={field.value ?? ''}
                              onChange={(v) => field.onChange(v)}
                              onBlur={field.onBlur}
                              min={1}
                              placeholder="—"
                            />
                          )}
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-secondary-foreground/75">Отдых (сек)</div>
                        <Controller
                          control={form.control}
                          name={`exercises.${idx}.rest_seconds`}
                          render={({ field }) => (
                            <NumberInput
                              ref={field.ref}
                              value={field.value ?? ''}
                              onChange={(v) => field.onChange(v)}
                              onBlur={field.onBlur}
                              min={0}
                              placeholder="—"
                            />
                          )}
                        />
                      </div>
                    </div>

                    {/* Строка 3: заметки + кнопка удалить */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="text-xs text-secondary-foreground/75">Заметки</div>
                        <Input
                          placeholder="Заметки к упражнению"
                          {...form.register(`exercises.${idx}.notes`)}
                          className="text-sm"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="lg"
                        className="shrink-0"
                        onClick={() => remove(idx)}
                      >
                        Удалить
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={Boolean(props.isSubmitting)}>
            {props.mode === 'create' ? 'Создать шаблон' : 'Сохранить'}
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}
