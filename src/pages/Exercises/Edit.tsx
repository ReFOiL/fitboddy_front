import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import {
  addTokenToVideoUrl,
  getExercise,
  queryKeys,
  updateExercise,
} from '../../api'
import type { ExerciseUpdate } from '../../types/exercise'
import { ExerciseForm, type ExerciseFormValues } from '../../components/forms/ExerciseForm'
import { Button } from '../../components/ui/button'

export function ExerciseEditPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const params = useParams<{ id: string }>()
  const id = Number(params.id)

  const exerciseQuery = useQuery({
    queryKey: queryKeys.exercises.detail(id),
    queryFn: () => getExercise(id),
    enabled: Number.isFinite(id),
    networkMode: 'always',
  })

  const update = useMutation({
    mutationFn: (values: ExerciseUpdate) => updateExercise(id, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.exercises.all })
      await queryClient.invalidateQueries({ queryKey: queryKeys.exercises.detail(id) })
      toast.success('Упражнение обновлено')
      navigate('/exercises')
    },
  })

  if (!Number.isFinite(id)) {
    return <div className="text-sm text-destructive">Некорректный id</div>
  }

  if (exerciseQuery.isLoading) {
    return <div className="text-sm text-secondary-foreground/80">Загрузка…</div>
  }

  if (exerciseQuery.isError || !exerciseQuery.data) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-destructive">Упражнение не найдено или ошибка загрузки.</div>
        <Button variant="secondary" onClick={() => navigate('/exercises')}>
          Назад к списку
        </Button>
      </div>
    )
  }

  const e = exerciseQuery.data
  const defaultValues: ExerciseFormValues = {
    name: e.name,
    description: e.description ?? null,
    video_url: e.video_url ?? null,
    equipment: e.equipment ?? null,
    workout_category: e.workout_category,
    is_cardio: e.is_cardio,
    difficulty: e.difficulty,
    muscle_ids: e.muscles?.map((m) => m.id) ?? [],
    contraindication_ids: e.contraindications?.map((c) => c.id) ?? [],
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Редактирование: {e.name}</h2>
          <p className="max-w-xl text-sm text-secondary-foreground/85">
            Изменения вступают в силу для новых планов; у пользователей с активным планом расписание обновится при
            следующей пересборке на стороне бота.
          </p>
        </div>
        <Button variant="secondary" className="shrink-0 self-start" onClick={() => navigate('/exercises')}>
          Назад
        </Button>
      </div>

      {e.video_stream_url && (
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <div className="mb-2 text-sm font-medium text-secondary-foreground/90">Видео</div>
          <video
            src={addTokenToVideoUrl(e.video_stream_url) ?? undefined}
            controls
            className="max-h-[320px] w-full rounded-lg bg-black/40"
            preload="metadata"
          >
            Твой браузер не поддерживает воспроизведение видео.
          </video>
        </div>
      )}

      <ExerciseForm
        mode="edit"
        defaultValues={defaultValues}
        onSubmit={async (values) => {
          await update.mutateAsync(values)
        }}
        isSubmitting={update.isPending}
      />
    </div>
  )
}
