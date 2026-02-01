import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { listQuestions, queryKeys, updateQuestion } from '../../api'
import type { CustomQuestionOut } from '../../types/question'
import { QuestionForm, type QuestionFormValues } from '../../components/forms/QuestionForm'

function isSystemQuestionKey(key: string) {
  return key.startsWith('system:')
}

export function QuestionEditPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const params = useParams<{ id: string }>()
  const id = Number(params.id)

  const questionsQuery = useQuery({
    queryKey: queryKeys.questions.all,
    queryFn: listQuestions,
    networkMode: 'always',
  })

  const question = useMemo(() => {
    if (!Number.isFinite(id)) return null
    return (questionsQuery.data ?? []).find((q: CustomQuestionOut) => q.id === id) ?? null
  }, [id, questionsQuery.data])

  const update = useMutation({
    mutationFn: (values: QuestionFormValues) => updateQuestion(id, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.questions.all })
      toast.success('Вопрос обновлён')
      navigate('/questions')
    },
  })

  if (!Number.isFinite(id)) {
    return <div className="text-sm text-destructive">Некорректный id</div>
  }

  if (questionsQuery.isLoading) {
    return <div className="text-sm text-secondary-foreground/80">Загрузка...</div>
  }

  if (questionsQuery.isError) {
    return <div className="text-sm text-destructive">Ошибка загрузки данных</div>
  }

  if (!question) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-secondary-foreground/80">Вопрос не найден в списке.</div>
        <button
          type="button"
          className="h-10 rounded-md border border-border bg-background px-4 text-sm"
          onClick={() => navigate('/questions')}
        >
          Назад к списку
        </button>
      </div>
    )
  }

  if (isSystemQuestionKey(question.key)) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Вопрос #{question.id}</h2>
          <button
            type="button"
            className="h-10 rounded-md border border-border bg-background px-4 text-sm"
            onClick={() => navigate('/questions')}
          >
            Назад
          </button>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 text-sm">
          <div className="font-medium">Системный вопрос</div>
          <div className="mt-2 text-secondary-foreground/80">
            Вопросы с ключом, начинающимся на <span className="font-mono">system:</span>, неизменяемы в админке.
          </div>

          <div className="mt-4 grid gap-2 text-sm">
            <div>
              <span className="text-secondary-foreground/80">key:</span> <span className="font-mono">{question.key}</span>
            </div>
            <div>
              <span className="text-secondary-foreground/80">order:</span> <span className="font-mono">{question.order}</span>
            </div>
            <div>
              <span className="text-secondary-foreground/80">type:</span> <span className="font-mono">{question.answer_type}</span>
            </div>
            <div className="whitespace-pre-wrap rounded-md border border-border bg-background/40 p-3">
              {question.text}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const defaultValues: QuestionFormValues = {
    key: question.key,
    order: question.order,
    text: question.text,
    answer_type: question.answer_type,
    options: question.options,
    min_value: question.min_value,
    max_value: question.max_value,
    pattern: question.pattern,
    is_required: question.is_required,
    is_active: question.is_active,
    category: question.category,
    tags: question.tags,
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Редактирование вопроса #{question.id}</h2>
        <button
          type="button"
          className="h-10 rounded-md border border-border bg-background px-4 text-sm"
          onClick={() => navigate('/questions')}
        >
          Назад
        </button>
      </div>

      <QuestionForm
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

