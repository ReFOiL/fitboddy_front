import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { createExercise, queryKeys } from '../../api'
import { ExerciseForm, type ExerciseFormValues } from '../../components/forms/ExerciseForm'
import { Button } from '../../components/ui/button'

export function ExerciseCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: (values: ExerciseFormValues) => createExercise(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.exercises.all })
      toast.success('Упражнение создано')
      navigate('/exercises', { replace: true })
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Новое упражнение</h2>
          <p className="max-w-xl text-sm text-secondary-foreground/85">
            Поле «Группа для планировщика» влияет на то, как упражнение попадает в недельное расписание вместе с другими
            позициями каталога.
          </p>
        </div>
        <Button variant="secondary" className="shrink-0 self-start" onClick={() => navigate('/exercises')}>
          Назад
        </Button>
      </div>

      <ExerciseForm
        mode="create"
        onSubmit={async (values) => {
          await create.mutateAsync(values)
        }}
        isSubmitting={create.isPending}
      />
    </div>
  )
}
