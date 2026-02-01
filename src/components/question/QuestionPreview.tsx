import type { CustomQuestionCreate } from '../../types/question'

export function QuestionPreview({ question }: { question: CustomQuestionCreate }) {
  const isChoice = question.answer_type === 'single_choice' || question.answer_type === 'multiple_choice'
  const isNumber = question.answer_type === 'number'
  const isText = question.answer_type === 'text'

  return (
    <div className="rounded-xl bg-[#1f1f1f] p-4">
      <div className="text-xs text-secondary-foreground/80">Telegram preview</div>
      <div className="mt-2 rounded-xl bg-[#2b2b2b] p-3">
        <div className="whitespace-pre-wrap text-sm leading-snug">{question.text || '—'}</div>

        <div className="mt-3 space-y-2">
          {isChoice ? (
            <div className="space-y-2">
              {(question.options ?? []).slice(0, 6).map((o) => (
                <div
                  key={`${o.value}:${o.label}`}
                  className="rounded-lg border border-border bg-background/40 px-3 py-2 text-sm"
                >
                  {o.label || o.value}
                </div>
              ))}
              {(question.options ?? []).length > 6 ? (
                <div className="text-xs text-secondary-foreground/70">… ещё варианты</div>
              ) : null}
            </div>
          ) : null}

          {isNumber ? (
            <div className="rounded-lg border border-border bg-background/40 px-3 py-2 text-sm text-secondary-foreground/80">
              Число{question.min_value != null ? ` от ${question.min_value}` : ''}{question.max_value != null ? ` до ${question.max_value}` : ''}
            </div>
          ) : null}

          {isText ? (
            <div className="rounded-lg border border-border bg-background/40 px-3 py-2 text-sm text-secondary-foreground/80">
              Текст{question.pattern ? ` (pattern: ${question.pattern})` : ''}
            </div>
          ) : null}

          {question.answer_type === 'boolean' ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-border bg-background/40 px-3 py-2 text-sm">Да</div>
              <div className="rounded-lg border border-border bg-background/40 px-3 py-2 text-sm">Нет</div>
            </div>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-secondary-foreground/70">
          <span className="rounded-md border border-border bg-background/40 px-2 py-1">key: {question.key || '—'}</span>
          <span className="rounded-md border border-border bg-background/40 px-2 py-1">order: {question.order ?? 0}</span>
          <span className="rounded-md border border-border bg-background/40 px-2 py-1">
            required: {question.is_required ? 'yes' : 'no'}
          </span>
          <span className="rounded-md border border-border bg-background/40 px-2 py-1">
            active: {question.is_active ? 'yes' : 'no'}
          </span>
        </div>
      </div>
    </div>
  )
}

