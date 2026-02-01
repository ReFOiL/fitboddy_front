import React, { useEffect, useMemo, useState } from 'react'
import type { DragEndEvent } from '@dnd-kit/core'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { GripVertical, Lock, MoreHorizontal, Pencil, Plus, RefreshCcw, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { deactivateQuestion, listQuestions, queryKeys, updateQuestion, updateQuestionOrder } from '../../api'
import type { CustomQuestionOut } from '../../types/question'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu'
import { Input } from '../../components/ui/input'
import { Select } from '../../components/ui/select'

function isSystemQuestionKey(key: string) {
  return key.startsWith('system:')
}

type AnswerType = CustomQuestionOut['answer_type']

export function QuestionsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [onlyActive, setOnlyActive] = useState<boolean | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<AnswerType | 'all'>('all')
  const [reorderMode, setReorderMode] = useState(false)
  const [ordered, setOrdered] = useState<CustomQuestionOut[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [confirmDeactivate, setConfirmDeactivate] = useState<CustomQuestionOut | null>(null)

  const questionsQuery = useQuery<CustomQuestionOut[]>({
    queryKey: queryKeys.questions.all,
    queryFn: listQuestions,
    networkMode: 'always',
  })

  useEffect(() => {
    if (!questionsQuery.data) return
    const sorted = [...questionsQuery.data].sort((a, b) => a.order - b.order)
    setOrdered(sorted)
    setSelectedIds(new Set())
  }, [questionsQuery.data])

  useEffect(() => {
    // Выделение связано с текущим представлением (чтобы не применять массовые действия "вслепую").
    setSelectedIds(new Set())
    setReorderMode(false)
  }, [onlyActive, search, categoryFilter, typeFilter])

  const toggleActive = useMutation({
    mutationFn: async (q: CustomQuestionOut) => updateQuestion(q.id, { is_active: !q.is_active }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.questions.all })
      toast.success('Обновлено')
    },
  })

  const deactivate = useMutation({
    mutationFn: async (q: CustomQuestionOut) => deactivateQuestion(q.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.questions.all })
      toast.success('Вопрос деактивирован')
    },
  })

  const reorder = useMutation({
    mutationFn: async ({ questionId, newOrder }: { questionId: number; newOrder: number }) =>
      updateQuestionOrder(questionId, newOrder),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.questions.all })
      toast.success('Порядок обновлён')
    },
  })

  const canReorder = search.trim() === '' && onlyActive === null && !reorder.isPending

  const bulkSetActive = useMutation({
    mutationFn: async ({ ids, isActive }: { ids: number[]; isActive: boolean }) => {
      await Promise.all(ids.map((id) => updateQuestion(id, { is_active: isActive })))
    },
    onSuccess: async (_data, vars) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.questions.all })
      setSelectedIds(new Set())
      toast.success(vars.isActive ? 'Активировано' : 'Деактивировано')
    },
  })

  const rows = useMemo(() => {
    const data = ordered
    const q = search.trim().toLowerCase()

    return data
      .filter((x: CustomQuestionOut) => {
        if (onlyActive === null) return true
        return x.is_active === onlyActive
      })
      .filter((x: CustomQuestionOut) => {
        if (categoryFilter === 'all') return true
        const c = x.category ?? ''
        if (categoryFilter === '__none__') return !c
        return c === categoryFilter
      })
      .filter((x: CustomQuestionOut) => {
        if (typeFilter === 'all') return true
        return x.answer_type === typeFilter
      })
      .filter((x: CustomQuestionOut) => {
        if (!q) return true
        return (
          x.text.toLowerCase().includes(q) ||
          x.key.toLowerCase().includes(q) ||
          (x.category ?? '').toLowerCase().includes(q) ||
          x.tags.some((t: string) => t.toLowerCase().includes(q))
        )
      })
      .sort((a: CustomQuestionOut, b: CustomQuestionOut) => a.order - b.order)
  }, [categoryFilter, onlyActive, ordered, search, typeFilter])

  const categoryOptions = useMemo(() => {
    const set = new Set<string>()
    for (const q of ordered) {
      if (q.category) set.add(q.category)
    }
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [ordered])

  const selectableRowIds = useMemo(
    () => rows.filter((r) => !isSystemQuestionKey(r.key)).map((r) => r.id),
    [rows],
  )

  const selectedCount = selectedIds.size
  const allSelected = selectableRowIds.length > 0 && selectableRowIds.every((id) => selectedIds.has(id))
  // someSelected больше не нужен (нет “табличного” select-all checkbox)

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (selectableRowIds.length === 0) return new Set()
      if (allSelected) return new Set()
      const next = new Set(prev)
      selectableRowIds.forEach((id) => next.add(id))
      return next
    })
  }

  const toggleSelectOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedEditableIds = useMemo(
    () => selectableRowIds.filter((id) => selectedIds.has(id)),
    [selectableRowIds, selectedIds],
  )

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  )

  const sortableIds = useMemo(() => rows.map((r) => r.id), [rows])

  const onDragEnd = (event: DragEndEvent) => {
    if (!canReorder || !reorderMode) return
    const { active, over } = event
    if (!over) return
    if (active.id === over.id) return

    const oldIndex = rows.findIndex((r) => r.id === active.id)
    const newIndex = rows.findIndex((r) => r.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    const moved = rows[oldIndex]
    const target = rows[newIndex]
    if (!moved || !target) return
    if (isSystemQuestionKey(moved.key)) return

    // Нельзя ставить "на позицию" системного вопроса — ищем ближайший не-системный якорь
    let anchor = target
    if (isSystemQuestionKey(anchor.key)) {
      anchor =
        rows.slice(newIndex + 1).find((r) => !isSystemQuestionKey(r.key)) ??
        rows.slice(0, newIndex).reverse().find((r) => !isSystemQuestionKey(r.key)) ??
        anchor
      if (isSystemQuestionKey(anchor.key)) return
    }

    // Локально переставляем (для UX), на бэкенд отправляем новый order = order "точки вставки".
    setOrdered((prev) => {
      const prevIds = prev.map((x) => x.id)
      const oldI = prevIds.indexOf(moved.id)
      const newI = prevIds.indexOf(target.id)
      if (oldI < 0 || newI < 0) return prev
      return arrayMove(prev, oldI, newI)
    })

    reorder.mutate({ questionId: moved.id, newOrder: anchor.order })
  }

  const selectAllInView = () => {
    toggleSelectAll()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Вопросы</h2>
          <div className="text-sm text-secondary-foreground/80">Управление анкетой: порядок, активность, редактирование</div>
        </div>
        <Button onClick={() => navigate('/questions/new')}>
          <Plus className="h-4 w-4" />
          Создать
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-secondary-foreground/80">
            Всего: <span className="font-medium text-foreground">{rows.length}</span>
            {selectedCount > 0 ? (
              <>
                {' '}
                · Выбрано: <span className="font-medium text-foreground">{selectedCount}</span>
              </>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={selectAllInView}
              disabled={rows.filter((r) => !isSystemQuestionKey(r.key)).length === 0}
            >
              {allSelected ? 'Снять выделение' : 'Выбрать всё'}
            </Button>

            <Button
              type="button"
              variant={reorderMode ? 'default' : 'secondary'}
              onClick={() => setReorderMode((v) => !v)}
              disabled={!canReorder}
              title={!canReorder ? 'Сортировка доступна только без поиска и фильтров' : 'Перемещение порядка'}
            >
              {reorderMode ? 'Готово' : 'Порядок'}
            </Button>
          </div>
        </div>

        {selectedCount > 0 ? (
          <div className="mb-3 flex flex-col gap-2 rounded-lg border border-border/70 bg-background/40 p-3 text-sm lg:flex-row lg:items-center lg:justify-between">
            <div className="text-secondary-foreground/80">
              Выбрано: <span className="font-medium text-foreground">{selectedCount}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={bulkSetActive.isPending}
                onClick={() => bulkSetActive.mutate({ ids: selectedEditableIds, isActive: true })}
              >
                Активировать
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={bulkSetActive.isPending}
                onClick={() => bulkSetActive.mutate({ ids: selectedEditableIds, isActive: false })}
              >
                Деактивировать
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSelectedIds(new Set())}
              >
                Очистить
              </Button>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <Input
              placeholder="Поиск: текст / key / категория / теги"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button
              type="button"
              onClick={() => questionsQuery.refetch()}
              disabled={questionsQuery.isFetching}
              title="Обновить"
              variant="secondary"
              size="lg"
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as AnswerType | 'all')}
              placeholder="Все типы"
              options={[
                { value: 'all', label: 'Все типы' },
                { value: 'text', label: 'text' },
                { value: 'number', label: 'number' },
                { value: 'single_choice', label: 'single_choice' },
                { value: 'multiple_choice', label: 'multiple_choice' },
                { value: 'boolean', label: 'boolean' },
              ]}
            />

            <Select
              value={categoryFilter}
              onValueChange={(v) => setCategoryFilter(v)}
              placeholder="Все категории"
              options={[
                { value: 'all', label: 'Все категории' },
                { value: '__none__', label: 'Без категории' },
                ...categoryOptions.map((c) => ({ value: c, label: c })),
              ]}
            />

            <Button
              type="button"
              variant={onlyActive === null ? 'default' : 'secondary'}
              size="lg"
              onClick={() => setOnlyActive(null)}
            >
              Все
            </Button>
            <Button
              type="button"
              variant={onlyActive === true ? 'default' : 'secondary'}
              size="lg"
              onClick={() => setOnlyActive(true)}
            >
              Активные
            </Button>
            <Button
              type="button"
              variant={onlyActive === false ? 'default' : 'secondary'}
              size="lg"
              onClick={() => setOnlyActive(false)}
            >
              Неактивные
            </Button>
          </div>
        </div>

        {!canReorder ? (
          <div className="mt-3 rounded-md border border-border/70 bg-background/40 px-3 py-2 text-xs text-secondary-foreground/80">
            Drag&drop порядка доступен только без поиска и фильтров.
          </div>
        ) : null}

        {/* Cards: везде. Делаем 1 карточку на строку + выше карточка. */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            <div className="mt-4 grid grid-cols-1 gap-3">
          {questionsQuery.isLoading ? (
            <div className="col-span-full rounded-lg border border-border/70 bg-background/40 p-3 text-sm text-secondary-foreground/80">
              Загрузка...
            </div>
          ) : questionsQuery.isError ? (
            <div className="col-span-full rounded-lg border border-border/70 bg-background/40 p-3 text-sm text-destructive">
              Ошибка загрузки. Проверь `admin token` и доступность бэкенда.
            </div>
          ) : rows.length === 0 ? (
            <div className="col-span-full rounded-lg border border-border/70 bg-background/40 p-3 text-sm text-secondary-foreground/80">
              Ничего не найдено.
            </div>
          ) : (
            rows.map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                reorderMode={reorderMode}
                isSelected={selectedIds.has(q.id)}
                onToggleSelect={() => toggleSelectOne(q.id)}
                onEdit={() => navigate(`/questions/${q.id}/edit`)}
                onToggleActive={() => toggleActive.mutate(q)}
                onDeactivate={() => setConfirmDeactivate(q)}
                disabled={isSystemQuestionKey(q.key)}
                isBusy={toggleActive.isPending || deactivate.isPending || reorder.isPending}
              />
            ))
          )}
            </div>
          </SortableContext>
        </DndContext>
        </CardContent>
      </Card>

      <Dialog open={Boolean(confirmDeactivate)} onOpenChange={(open) => (open ? undefined : setConfirmDeactivate(null))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Деактивировать вопрос?</DialogTitle>
            <DialogDescription>
              В бэкенде это выполняется через <span className="font-mono">DELETE /admin/questions/{"{id}"}</span>.
            </DialogDescription>
          </DialogHeader>

          {confirmDeactivate ? (
            <div className="mt-4 space-y-2">
              <div className="text-sm text-secondary-foreground/80">
                key: <span className="font-mono">{confirmDeactivate.key}</span>
              </div>
              <div className="rounded-md border border-border bg-secondary/30 p-3 text-sm whitespace-pre-wrap">
                {confirmDeactivate.text}
              </div>
            </div>
          ) : null}

          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmDeactivate(null)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              disabled={!confirmDeactivate || deactivate.isPending}
              onClick={() => {
                if (!confirmDeactivate) return
                deactivate.mutate(confirmDeactivate, {
                  onSuccess: async () => {
                    setConfirmDeactivate(null)
                    await queryClient.invalidateQueries({ queryKey: queryKeys.questions.all })
                    toast.success('Вопрос деактивирован')
                  },
                })
              }}
            >
              Деактивировать
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SortableRow(props: { id: number; disabled: boolean; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.id,
    disabled: props.disabled,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {props.children}
    </div>
  )
}

function QuestionCard(props: {
  question: CustomQuestionOut
  reorderMode: boolean
  isSelected: boolean
  disabled: boolean
  isBusy: boolean
  onToggleSelect: () => void
  onEdit: () => void
  onToggleActive: () => void
  onDeactivate: () => void
}) {
  const q = props.question
  const isChoice = q.answer_type === 'single_choice' || q.answer_type === 'multiple_choice'
  const hasOptions = Boolean(q.options && q.options.length > 0)
  const showOptions = q.answer_type === 'boolean' || (isChoice && hasOptions)
  const hasTags = q.tags.length > 0
  const actionsDisabled = props.isBusy || props.disabled

  const content = (
    <Card
      className={[
        // без translate -> без “дёрганья”
        'group',
        'transition-[box-shadow,border-color,background-color] duration-200 ease-out',
        'hover:border-primary/30 hover:bg-card/80 hover:shadow-[0_18px_60px_rgba(0,0,0,0.32)]',
        props.reorderMode ? 'ring-1 ring-primary/30' : '',
      ].join(' ')}
    >
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 flex-1">
            {/* Мета — сверху */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="muted">#{q.order}</Badge>
              <Badge variant={q.is_active ? 'primary' : 'muted'}>{q.is_active ? 'active' : 'inactive'}</Badge>
              {q.is_required ? <Badge variant="muted">required</Badge> : null}
              <Badge variant="default">{q.answer_type}</Badge>
              {q.category ? <Badge variant="default">{q.category}</Badge> : <Badge variant="muted">no category</Badge>}
              {props.disabled ? (
                <Badge variant="muted">
                  <Lock className="h-3 w-3" />
                  system
                </Badge>
              ) : null}
            </div>

            <div className="mt-2 text-sm text-secondary-foreground/80">
              Ключ: <span className="font-mono text-foreground/90">{q.key}</span>
            </div>

            {/* Вопрос — главный фокус */}
            <div
              className={[
                'mt-4 relative overflow-hidden rounded-2xl border border-primary/25 p-5',
                'bg-gradient-to-br from-secondary/25 via-secondary/10 to-primary/10',
                'transition-[border-color,box-shadow,background-color] duration-300 ease-out',
                // акцент всегда видимый (не только hover)
                'border-primary/45 bg-secondary/20',
                'shadow-[0_12px_44px_rgb(var(--accent-rgb)_/_0.16)]',
                // hover — лишь лёгкое усиление
                'group-hover:border-primary/55 group-hover:shadow-[0_14px_54px_rgb(var(--accent-rgb)_/_0.22)]',
                'motion-reduce:transition-none',
              ].join(' ')}
            >
              {/* акцентная полоса слева */}
              <div className="pointer-events-none absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-primary/70 via-sky-500/25 to-emerald-500/15 opacity-80" />

              {/* мягкое свечение на hover */}
              <div
                className={[
                  'pointer-events-none absolute -inset-10 opacity-70 blur-2xl',
                  'transition-opacity duration-300 ease-out',
                  'group-hover:opacity-100',
                  'motion-reduce:transition-none',
                  // radial glow
                  'bg-[radial-gradient(circle_at_30%_20%,rgb(var(--accent-rgb)_/_0.30),transparent_55%),radial-gradient(circle_at_85%_65%,rgb(var(--sky-rgb)_/_0.18),transparent_55%)]',
                ].join(' ')}
              />

              <div className="relative whitespace-pre-wrap text-lg font-semibold leading-snug text-foreground md:text-xl">
                {q.text}
              </div>
            </div>

            <div className="mt-3 space-y-3">
              {/* Теги */}
              <div className="rounded-2xl border border-border/60 bg-secondary/12 p-4">
                <div className="text-[11px] font-medium tracking-wide text-secondary-foreground/80">ТЕГИ</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {hasTags ? (
                    <>
                      {q.tags.slice(0, 10).map((t) => (
                        <span key={t} className="rounded-full border border-border bg-secondary/30 px-3 py-1 text-sm">
                          {t}
                        </span>
                      ))}
                      {q.tags.length > 10 ? (
                        <span className="rounded-full border border-border bg-secondary/15 px-3 py-1 text-sm text-secondary-foreground/80">
                          +{q.tags.length - 10} ещё
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <span className="text-sm text-secondary-foreground/70">—</span>
                  )}
                </div>
              </div>

              {/* Варианты / Ответ */}
              <div className="rounded-2xl border border-border/60 bg-secondary/12 p-4">
                <div className="text-[11px] font-medium tracking-wide text-secondary-foreground/80">
                  {showOptions ? 'ВАРИАНТЫ' : 'ОТВЕТ'}
                </div>

                {showOptions ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {q.answer_type === 'boolean' ? (
                      <>
                        <span className="rounded-full border border-border bg-secondary/30 px-3 py-1 text-sm">Да</span>
                        <span className="rounded-full border border-border bg-secondary/30 px-3 py-1 text-sm">Нет</span>
                      </>
                    ) : (
                      <>
                        {(q.options ?? []).slice(0, 8).map((opt) => (
                          <span
                            key={`${opt.value}:${opt.label}`}
                            className="rounded-full border border-border bg-secondary/30 px-3 py-1 text-sm"
                            title={opt.value}
                          >
                            {opt.label || opt.value}
                          </span>
                        ))}
                        {(q.options ?? []).length > 8 ? (
                          <span className="rounded-full border border-border bg-secondary/15 px-3 py-1 text-sm text-secondary-foreground/80">
                            +{(q.options ?? []).length - 8} ещё
                          </span>
                        ) : null}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="mt-2">
                    {q.answer_type === 'text' ? (
                      <div className="space-y-2">
                        <div className="text-sm text-secondary-foreground/80">Свободный ввод текста</div>
                        <div className="h-11 rounded-md border border-border/70 bg-background/10 px-3 py-3 text-sm text-secondary-foreground/70">
                          Поле ввода…
                        </div>
                        {q.pattern ? (
                          <div className="text-xs text-secondary-foreground/70">
                            pattern: <span className="font-mono">{q.pattern}</span>
                          </div>
                        ) : null}
                      </div>
                    ) : q.answer_type === 'number' ? (
                      <div className="space-y-2">
                        <div className="text-sm text-secondary-foreground/80">Числовой ввод</div>
                        <div className="flex items-center justify-between text-xs text-secondary-foreground/70">
                          <span>min: {q.min_value ?? '—'}</span>
                          <span>max: {q.max_value ?? '—'}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-background/10">
                          <div className="h-2 w-2/5 rounded-full bg-primary/50" />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-sm text-secondary-foreground/80">Варианты не заданы</div>
                        <div className="text-sm text-secondary-foreground/70">
                          Для этого типа ответа ожидаются варианты. Добавь их в редактировании.
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 md:flex-col md:items-end">
            {!props.disabled ? (
              <label className="flex items-center gap-2 text-sm text-secondary-foreground/80">
                <input
                  type="checkbox"
                  className="h-5 w-5"
                  checked={props.isSelected}
                  onChange={props.onToggleSelect}
                  disabled={props.isBusy || props.reorderMode}
                />
                Выбрать
              </label>
            ) : (
              <div className="text-sm text-secondary-foreground/60">read-only</div>
            )}

            {props.reorderMode ? (
              <Button variant="secondary" size="lg" aria-label="Переместить" disabled={props.disabled}>
                <GripVertical className="h-4 w-4" />
                Переместить
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={actionsDisabled}>
                  <Button
                    variant="secondary"
                    size="lg"
                    aria-label="Действия"
                    disabled={actionsDisabled}
                    title={props.disabled ? 'Системный вопрос: действия недоступны' : undefined}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    Действия
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled={props.disabled} onSelect={props.onEdit}>
                    <Pencil className="h-4 w-4" />
                    Редактировать
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={props.disabled || props.isBusy} onSelect={props.onToggleActive}>
                    {q.is_active ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                    {q.is_active ? 'Выключить' : 'Включить'}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:bg-destructive/15 focus:text-destructive"
                    disabled={props.disabled}
                    onSelect={props.onDeactivate}
                  >
                    <Trash2 className="h-4 w-4" />
                    Деактивировать
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (!props.reorderMode) return content

  return (
    <SortableRow id={q.id} disabled={props.disabled}>
      {content}
    </SortableRow>
  )
}

