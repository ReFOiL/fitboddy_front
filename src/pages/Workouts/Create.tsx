import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { createWorkoutTemplate, queryKeys } from '../../api'
import { WorkoutTemplateForm, type WorkoutTemplateFormValues } from '../../components/forms/WorkoutTemplateForm'
import { Button } from '../../components/ui/button'

export function WorkoutCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: (values: WorkoutTemplateFormValues) => createWorkoutTemplate(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.workoutTemplates.all })
      toast.success('Шаблон создан')
      navigate('/workouts', { replace: true })
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Новый шаблон тренировки</h2>
        <Button variant="secondary" onClick={() => navigate('/workouts')}>
          Назад
        </Button>
      </div>

      <WorkoutTemplateForm
        mode="create"
        onSubmit={async (values) => {
          await create.mutateAsync(values)
        }}
        isSubmitting={create.isPending}
      />
    </div>
  )
}
