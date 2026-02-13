import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import {
  getWorkoutTemplate,
  queryKeys,
  updateWorkoutTemplate,
} from '../../api'
import type { WorkoutTemplateOut } from '../../types/workout'
import { WorkoutTemplateForm, type WorkoutTemplateFormValues } from '../../components/forms/WorkoutTemplateForm'
import { Button } from '../../components/ui/button'

export function WorkoutEditPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const params = useParams<{ id: string }>()
  const id = Number(params.id)

  const templateQuery = useQuery({
    queryKey: queryKeys.workoutTemplates.detail(id),
    queryFn: () => getWorkoutTemplate(id),
    enabled: Number.isFinite(id),
    networkMode: 'always',
  })

  const update = useMutation({
    mutationFn: (values: WorkoutTemplateFormValues) => updateWorkoutTemplate(id, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.workoutTemplates.all })
      await queryClient.invalidateQueries({ queryKey: queryKeys.workoutTemplates.detail(id) })
      toast.success('Шаблон обновлён')
      navigate('/workouts')
    },
  })

  if (!Number.isFinite(id)) {
    return (
      <div className="text-sm text-destructive">Некорректный id</div>
    )
  }

  if (templateQuery.isLoading) {
    return <div className="text-sm text-secondary-foreground/80">Загрузка…</div>
  }

  if (templateQuery.isError || !templateQuery.data) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-destructive">Шаблон не найден или ошибка загрузки.</div>
        <Button variant="secondary" onClick={() => navigate('/workouts')}>
          Назад к списку
        </Button>
      </div>
    )
  }

  const t: WorkoutTemplateOut = templateQuery.data
  const defaultValues: WorkoutTemplateFormValues = {
    title: t.title,
    goal: t.goal,
    difficulty: t.difficulty,
    equipment: t.equipment ?? null,
    days_per_week: t.days_per_week,
    description: t.description ?? null,
    is_active: t.is_active,
    exercises:
      t.workout_exercises?.map((we) => ({
        exercise_id: we.exercise_id,
        sort_order: we.sort_order,
        sets: we.sets ?? null,
        reps: we.reps ?? null,
        duration_seconds: we.duration_seconds ?? null,
        rest_seconds: we.rest_seconds ?? null,
        notes: we.notes ?? null,
      })) ?? [],
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Редактирование: {t.title}</h2>
        <Button variant="secondary" onClick={() => navigate('/workouts')}>
          Назад
        </Button>
      </div>

      <WorkoutTemplateForm
        mode="edit"
        templateId={id}
        defaultValues={defaultValues}
        onSubmit={async (values) => {
          await update.mutateAsync(values)
        }}
        isSubmitting={update.isPending}
        onOrderChanged={async () => {
          await queryClient.invalidateQueries({ queryKey: queryKeys.workoutTemplates.detail(id) })
        }}
      />
    </div>
  )
}
