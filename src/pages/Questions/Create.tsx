import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { createQuestion, queryKeys } from '../../api'
import { QuestionForm, type QuestionFormValues } from '../../components/forms/QuestionForm'

export function QuestionCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: (values: QuestionFormValues) => createQuestion(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.questions.all })
      toast.success('Вопрос создан')
      navigate('/questions', { replace: true })
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Создание вопроса</h2>
        <button
          type="button"
          className="h-10 rounded-md border border-border bg-background px-4 text-sm"
          onClick={() => navigate('/questions')}
        >
          Назад
        </button>
      </div>

      <QuestionForm
        mode="create"
        onSubmit={async (values) => {
          await create.mutateAsync(values)
        }}
        isSubmitting={create.isPending}
      />
    </div>
  )
}

