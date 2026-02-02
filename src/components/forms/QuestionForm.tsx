import { useEffect, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

import { listQuestions, queryKeys } from '../../api'
import type { CustomQuestionCreate, CustomQuestionOut } from '../../types/question'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Input } from '../ui/input'
import { Select } from '../ui/select'
import { QuestionPreview } from '../question/QuestionPreview'

const optionSchema = z.object({
  value: z.string().min(1, 'value обязателен'),
  label: z.string().min(1, 'label обязателен'),
})

const nullableInt = z.preprocess(
  (v) => {
    if (v === '' || v === null || v === undefined) return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  },
  z.number().int().nullable(),
)

const formSchema = z
  .object({
    key: z.string().min(1, 'key обязателен'),
    order: z.coerce.number().int().min(0).default(0),
    text: z.string().min(1, 'Введите текст').max(500, 'Максимум 500 символов'),
    answer_type: z.enum(['text', 'number', 'single_choice', 'multiple_choice', 'boolean']),
    options: z.array(optionSchema).default([]),
    min_value: nullableInt.optional(),
    max_value: nullableInt.optional(),
    pattern: z.preprocess((v) => (v === '' || v == null ? null : String(v)), z.string().nullable()).optional(),
    is_required: z.coerce.boolean().default(false),
    is_active: z.coerce.boolean().default(true),
    category: z.preprocess((v) => (v === '' || v == null ? null : String(v)), z.string().max(50, 'Максимум 50 символов').nullable()).optional(),
    tagsText: z.string().optional().default(''),
  })
  .superRefine((v, ctx) => {
    const isChoice = v.answer_type === 'single_choice' || v.answer_type === 'multiple_choice'
    if (isChoice) {
      if (!v.options || v.options.length === 0) {
        ctx.addIssue({ code: 'custom', message: 'Добавьте хотя бы один вариант', path: ['options'] })
      }
    }
    if (v.answer_type === 'number') {
      if (v.min_value != null && v.max_value != null && v.min_value > v.max_value) {
        ctx.addIssue({ code: 'custom', message: 'min_value должен быть <= max_value', path: ['min_value'] })
      }
    }
  })

export type QuestionFormValues = CustomQuestionCreate
type QuestionFormData = z.output<typeof formSchema>

function isSystemQuestionKey(key: string) {
  return key.startsWith('system:')
}

function parseTags(text: string): string[] {
  return text
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}

export function QuestionForm(props: {
  mode: 'create' | 'edit'
  defaultValues?: Partial<CustomQuestionCreate>
  isSubmitting?: boolean
  onSubmit: (values: QuestionFormValues) => Promise<void>
}) {
  const minOrderQuery = useQuery<CustomQuestionOut[], unknown, number>({
    queryKey: queryKeys.questions.all,
    queryFn: listQuestions,
    networkMode: 'always',
    select: (questions: CustomQuestionOut[]) => {
      const systemMax = Math.max(
        0,
        ...questions
          .filter((q) => typeof q.key === 'string' && isSystemQuestionKey(q.key))
          .map((q) => (typeof q.order === 'number' ? q.order : 0)),
      )
      return systemMax + 1
    },
  })

  const minCustomOrder = minOrderQuery.data ?? 1

  const form = useForm<QuestionFormData>({
    // zodResolver типизируется через input схемы и может конфликтовать с output при preprocess;
    // здесь нам важнее стабильная типизация формы и payload.
    resolver: zodResolver(formSchema) as unknown as Resolver<QuestionFormData>,
    defaultValues: {
      key: props.defaultValues?.key ?? '',
      order: Math.max(minCustomOrder, props.defaultValues?.order ?? 0),
      text: props.defaultValues?.text ?? '',
      answer_type: props.defaultValues?.answer_type ?? 'text',
      options: props.defaultValues?.options ?? [],
      min_value: props.defaultValues?.min_value ?? null,
      max_value: props.defaultValues?.max_value ?? null,
      pattern: props.defaultValues?.pattern ?? null,
      is_required: props.defaultValues?.is_required ?? false,
      is_active: props.defaultValues?.is_active ?? true,
      category: props.defaultValues?.category ?? null,
      tagsText: props.defaultValues?.tags ? props.defaultValues.tags.join(', ') : '',
    },
  })

  useEffect(() => {
    const current = form.getValues('order')
    const dirty = Boolean(form.formState.dirtyFields.order)
    if (dirty) return
    if (typeof current !== 'number') return
    if (current < minCustomOrder) {
      form.setValue('order', minCustomOrder, { shouldDirty: false, shouldTouch: false, shouldValidate: true })
    }
  }, [form, minCustomOrder])

  const answerType = useWatch({ control: form.control, name: 'answer_type' })
  const previewKey = useWatch({ control: form.control, name: 'key' })
  const previewOrder = useWatch({ control: form.control, name: 'order' })
  const previewText = useWatch({ control: form.control, name: 'text' })
  const previewOptions = useWatch({ control: form.control, name: 'options' })
  const previewMin = useWatch({ control: form.control, name: 'min_value' })
  const previewMax = useWatch({ control: form.control, name: 'max_value' })
  const previewPattern = useWatch({ control: form.control, name: 'pattern' })
  const previewRequired = useWatch({ control: form.control, name: 'is_required' })
  const previewActive = useWatch({ control: form.control, name: 'is_active' })
  const previewCategory = useWatch({ control: form.control, name: 'category' })
  const previewTagsText = useWatch({ control: form.control, name: 'tagsText' })

  const categoriesQuery = useQuery({
    queryKey: queryKeys.questions.all,
    queryFn: listQuestions,
    networkMode: 'always',
    select: (questions) => {
      const set = new Set<string>()
      for (const q of questions) {
        if (typeof q.category === 'string' && q.category.trim()) set.add(q.category.trim())
      }
      return Array.from(set).sort((a, b) => a.localeCompare(b, 'ru', { sensitivity: 'base' }))
    },
  })

  const categoryOptions = useMemo(() => {
    const opts = categoriesQuery.data ?? []
    return opts.map((c) => ({ value: c, label: c }))
  }, [categoriesQuery.data])

  const categorySelectValue = useMemo(() => {
    const current = typeof previewCategory === 'string' ? previewCategory.trim() : ''
    const existing = categoriesQuery.data ?? []
    return current && existing.includes(current) ? current : ''
  }, [categoriesQuery.data, previewCategory])

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'options',
  })

  const isChoice = answerType === 'single_choice' || answerType === 'multiple_choice'
  const isNumber = answerType === 'number'
  const isText = answerType === 'text'

  const previewValues: CustomQuestionCreate = {
    key: previewKey ?? '',
    order: typeof previewOrder === 'number' ? previewOrder : Number(previewOrder ?? 0),
    text: previewText ?? '',
    answer_type: answerType,
    options: isChoice ? (previewOptions ?? []) : null,
    min_value: isNumber ? (previewMin ?? null) : null,
    max_value: isNumber ? (previewMax ?? null) : null,
    pattern: isText ? (previewPattern ?? null) : null,
    is_required: Boolean(previewRequired),
    is_active: Boolean(previewActive),
    category: previewCategory ? String(previewCategory) : null,
    tags: parseTags(previewTagsText ?? ''),
  }

  return (
    <form
      className="grid gap-4 lg:grid-cols-2"
      onSubmit={form.handleSubmit(async (raw) => {
        // Жёстко гарантируем: кастомные вопросы начинаются после системных.
        if (raw.order < minCustomOrder) {
          form.setError('order', {
            type: 'min',
            message: `Минимальный order: ${minCustomOrder} (после системных вопросов)`,
          })
          return
        }

        const values: QuestionFormValues = {
          key: raw.key.trim(),
          order: Math.max(minCustomOrder, raw.order ?? 0),
          text: raw.text,
          answer_type: raw.answer_type,
          options: isChoice ? raw.options : null,
          min_value: isNumber ? (raw.min_value ?? null) : null,
          max_value: isNumber ? (raw.max_value ?? null) : null,
          pattern: isText ? (raw.pattern ?? null) : null,
          is_required: Boolean(raw.is_required),
          is_active: Boolean(raw.is_active),
          category: raw.category ? raw.category : null,
          tags: parseTags(raw.tagsText ?? ''),
        }
        await props.onSubmit(values)
      })}
    >
      <Card>
        <CardContent className="space-y-4 p-4">
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm">Key</label>
            <Input {...form.register('key')} />
            {form.formState.errors.key?.message ? (
              <div className="text-sm text-destructive">{form.formState.errors.key.message}</div>
            ) : null}
          </div>
          <div className="space-y-1">
            <label className="text-sm">Order</label>
            <Input type="number" inputMode="numeric" min={minCustomOrder} {...form.register('order')} />
            <div className="text-xs text-secondary-foreground/75">
              Минимум: <span className="font-mono">{minCustomOrder}</span> (после системных)
            </div>
            {form.formState.errors.order?.message ? (
              <div className="text-sm text-destructive">{form.formState.errors.order.message}</div>
            ) : null}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm">Текст</label>
          <textarea
            className="min-h-[110px] w-full resize-y rounded-md border border-border bg-control px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            {...form.register('text')}
          />
          <div className="flex items-center justify-between text-xs text-secondary-foreground/80">
            <span>{form.formState.errors.text?.message ?? ''}</span>
            <span>{(form.getValues('text') ?? '').length}/500</span>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm">Тип ответа</label>
            <Select
              value={answerType}
              onValueChange={(v) => form.setValue('answer_type', v as QuestionFormData['answer_type'], { shouldDirty: true })}
              options={[
                { value: 'text', label: 'text' },
                { value: 'number', label: 'number' },
                { value: 'single_choice', label: 'single_choice' },
                { value: 'multiple_choice', label: 'multiple_choice' },
                { value: 'boolean', label: 'boolean' },
              ]}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm">Категория</label>
            <div className="space-y-2">
              <div className="space-y-1">
                <div className="text-xs text-secondary-foreground/75">Выбрать из существующих</div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="sm:flex-1">
                    <Select
                      value={categorySelectValue}
                      disabled={categoriesQuery.isLoading || (categoriesQuery.data?.length ?? 0) === 0}
                      placeholder={
                        categoriesQuery.isLoading
                          ? 'Загрузка категорий…'
                          : (categoriesQuery.data?.length ?? 0) === 0
                            ? 'Категорий пока нет'
                            : 'Выбери категорию'
                      }
                      onValueChange={(v) => {
                        // важное: если пользователь вводит свою категорию, она может не быть в списке.
                        // Поэтому селект — “пикер” существующих, а не отражение текущего значения.
                        form.setValue('category', v, { shouldDirty: true, shouldTouch: true })
                      }}
                      options={categoryOptions}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="sm:shrink-0"
                    disabled={categoriesQuery.isLoading}
                    onClick={() => form.setValue('category', '', { shouldDirty: true, shouldTouch: true })}
                    title="Очистить категорию"
                  >
                    Очистить
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-secondary-foreground/75">Или введи новую</div>
                <Input placeholder="например: onboarding" {...form.register('category')} />
              </div>
            </div>
            {form.formState.errors.category?.message ? (
              <div className="text-sm text-destructive">{form.formState.errors.category.message}</div>
            ) : null}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm">Теги (через запятую)</label>
          <Input placeholder="например: premium, health" {...form.register('tagsText')} />
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4" {...form.register('is_required')} />
            Обязательный
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4" {...form.register('is_active')} />
            Активный
          </label>
        </div>

        {isNumber ? (
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm">min_value</label>
              <Input type="number" {...form.register('min_value')} />
              {form.formState.errors.min_value?.message ? (
                <div className="text-sm text-destructive">{form.formState.errors.min_value.message}</div>
              ) : null}
            </div>
            <div className="space-y-1">
              <label className="text-sm">max_value</label>
              <Input type="number" {...form.register('max_value')} />
              {form.formState.errors.max_value?.message ? (
                <div className="text-sm text-destructive">{form.formState.errors.max_value.message}</div>
              ) : null}
            </div>
          </div>
        ) : null}

        {isText ? (
          <div className="space-y-1">
            <label className="text-sm">Regex pattern</label>
            <Input placeholder="например: ^[a-z]+$" {...form.register('pattern')} />
            {form.formState.errors.pattern?.message ? (
              <div className="text-sm text-destructive">{form.formState.errors.pattern.message}</div>
            ) : null}
          </div>
        ) : null}

        {isChoice ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm">Варианты</div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    append({ value: '', label: '' })
                  }}
                >
                  Добавить
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => replace([{ value: 'yes', label: 'Да' }, { value: 'no', label: 'Нет' }])}
                >
                  Пресет Да/Нет
                </Button>
              </div>
            </div>

            {form.formState.errors.options?.message ? (
              <div className="text-sm text-destructive">{form.formState.errors.options.message}</div>
            ) : null}

            <div className="space-y-2">
              {fields.map((f, idx) => (
                <div key={f.id} className="grid gap-2 lg:grid-cols-[1fr_1fr_auto]">
                  <Input placeholder="value" {...form.register(`options.${idx}.value` as const)} />
                  <Input placeholder="label" {...form.register(`options.${idx}.label` as const)} />
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    onClick={() => remove(idx)}
                  >
                    Удалить
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <Button type="submit" size="lg" variant="cta" className="w-full" disabled={Boolean(props.isSubmitting)}>
          {props.mode === 'create' ? 'Создать' : 'Сохранить'}
        </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="text-sm font-medium">Превью (как в боте)</div>
          <div className="mt-3">
            <QuestionPreview question={previewValues} />
          </div>
        </CardContent>
      </Card>
    </form>
  )
}

