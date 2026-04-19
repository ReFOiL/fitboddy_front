import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Film, MoreHorizontal, Pencil, Plus, RefreshCcw, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import {
  addTokenToVideoUrl,
  deleteExercise,
  listExercises,
  queryKeys,
} from '../../api'
import { WORKOUT_CATEGORY_OPTIONS } from '../../lib/exerciseCategories'
import type { ExerciseOut } from '../../types/exercise'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { Input } from '../../components/ui/input'
import { Select } from '../../components/ui/select'

export function ExercisesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [confirmDelete, setConfirmDelete] = useState<ExerciseOut | null>(null)

  const exercisesQuery = useQuery({
    queryKey: queryKeys.exercises.all,
    queryFn: listExercises,
    networkMode: 'always',
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteExercise(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.exercises.all })
      setConfirmDelete(null)
      toast.success('Упражнение удалено')
    },
  })

  const all = exercisesQuery.data ?? []

  const stats = useMemo(() => {
    const total = all.length
    const cardio = all.filter((e) => e.is_cardio).length
    const withVideo = all.filter((e) => Boolean(e.video_url || e.video_stream_url)).length
    const categories = new Set(all.map((e) => e.workout_category)).size
    return { total, cardio, withVideo, categories }
  }, [all])

  const filtered = useMemo(() => {
    let list = all
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          (e.equipment ?? '').toLowerCase().includes(q) ||
          workoutCategoryLabel(e.workout_category).toLowerCase().includes(q) ||
          e.muscles.some((m) => m.name.toLowerCase().includes(q))
      )
    }
    if (categoryFilter !== 'all') {
      list = list.filter((e) => e.workout_category === categoryFilter)
    }
    return list
  }, [all, search, categoryFilter])

  const categorySelectOptions = [
    { value: 'all', label: 'Все группы' },
    ...WORKOUT_CATEGORY_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
  ]

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden" style={{ backgroundColor: 'var(--surface-section)' }}>
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">Каталог упражнений</h2>
              <p className="max-w-2xl text-sm text-secondary-foreground/85">
                Здесь содержимое, из которого бот собирает план: видео, группа для планировщика, мышцы и
                противопоказания. После изменений пользователям может понадобиться новый цикл плана (пересборка на
                стороне бота).
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button variant="cta" onClick={() => navigate('/exercises/new')}>
                <Plus className="h-4 w-4" />
                Создать
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => exercisesQuery.refetch()}
                disabled={exercisesQuery.isFetching}
                title="Обновить список"
              >
                <RefreshCcw className="h-4 w-4" />
                Обновить
              </Button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
            <div className="rounded-xl border border-border bg-secondary p-3">
              <div className="text-[11px] font-medium tracking-wide text-secondary-foreground/80">ВСЕГО</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums">{stats.total}</div>
            </div>
            <div className="rounded-xl border border-border bg-secondary p-3">
              <div className="text-[11px] font-medium tracking-wide text-secondary-foreground/80">С ВИДЕО</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums">{stats.withVideo}</div>
            </div>
            <div className="rounded-xl border border-border bg-secondary p-3">
              <div className="text-[11px] font-medium tracking-wide text-secondary-foreground/80">КАРДИО</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums">{stats.cardio}</div>
            </div>
            <div className="rounded-xl border border-border bg-secondary p-3">
              <div className="text-[11px] font-medium tracking-wide text-secondary-foreground/80">ГРУПП ПЛАНА</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums">{stats.categories}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card style={{ backgroundColor: 'var(--surface-section)' }}>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="min-w-0 flex-1 space-y-2">
            <label className="text-xs font-medium text-secondary-foreground/80">Поиск</label>
            <Input
              placeholder="Название, оборудование, мышцы, группа…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full space-y-2 sm:w-56">
            <label className="text-xs font-medium text-secondary-foreground/80">Группа планировщика</label>
            <Select
              value={categoryFilter}
              onValueChange={setCategoryFilter}
              options={categorySelectOptions}
            />
          </div>
        </CardContent>
      </Card>

      {exercisesQuery.isLoading && (
        <div className="text-sm text-secondary-foreground/80">Загрузка…</div>
      )}
      {exercisesQuery.isError && (
        <div className="text-sm text-destructive">Ошибка загрузки. Проверь доступность бэкенда.</div>
      )}
      {exercisesQuery.data && filtered.length === 0 && (
        <Card>
          <CardContent className="space-y-2 py-8 text-center text-sm text-secondary-foreground/80">
            <div>
              {search.trim() || categoryFilter !== 'all'
                ? 'Ничего не найдено по текущим фильтрам.'
                : 'В каталоге пока нет упражнений — создай первое или запусти сидер на бэкенде.'}
            </div>
            {(search.trim() || categoryFilter !== 'all') && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="mx-auto"
                onClick={() => {
                  setSearch('')
                  setCategoryFilter('all')
                }}
              >
                Сбросить фильтры
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {filtered.length > 0 && (
        <div className="flex items-center justify-between text-xs text-secondary-foreground/75">
          <span>
            Показано <span className="font-medium text-foreground">{filtered.length}</span>
            {filtered.length !== stats.total ? (
              <>
                {' '}
                из <span className="tabular-nums">{stats.total}</span>
              </>
            ) : null}
          </span>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((e) => (
            <ExerciseCard
              key={e.id}
              exercise={e}
              onEdit={() => navigate(`/exercises/${e.id}/edit`)}
              onDelete={() => setConfirmDelete(e)}
            />
          ))}
        </div>
      )}

      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить упражнение?</DialogTitle>
            <DialogDescription>
              «{confirmDelete?.name}» будет удалено. Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
            >
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function workoutCategoryLabel(value: string): string {
  return WORKOUT_CATEGORY_OPTIONS.find((o) => o.value === value)?.label ?? value
}

function ExerciseCard(props: {
  exercise: ExerciseOut
  onEdit: () => void
  onDelete: () => void
}) {
  const e = props.exercise

  return (
    <Card className="transition-[box-shadow,border-color,background-color] duration-200 ease-out hover:border-primary/30 hover:bg-card/80 hover:shadow-[0_18px_60px_rgba(0,0,0,0.32)]">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="muted">#{e.id}</Badge>
              <Badge variant="primary">{workoutCategoryLabel(e.workout_category)}</Badge>
              <Badge variant="default">сложность {e.difficulty}</Badge>
              {e.is_cardio && <Badge variant="default">кардио</Badge>}
              {e.equipment ? <Badge variant="muted">{e.equipment}</Badge> : null}
            </div>
            <h3 className="mt-3 text-lg font-semibold">{e.name}</h3>
            {e.description ? (
              <p className="mt-2 line-clamp-2 text-sm text-secondary-foreground/80">{e.description}</p>
            ) : null}
            {(e.muscles?.length ?? 0) > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {e.muscles.map((m) => (
                  <span key={m.id} className="rounded-full border border-border/60 bg-secondary/20 px-2 py-0.5 text-xs">
                    {m.name}
                  </span>
                ))}
              </div>
            )}
            {(e.contraindications?.length ?? 0) > 0 && (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {e.contraindications.map((c) => (
                  <span key={c.id} className="rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-xs text-destructive/90">
                    {c.name}
                  </span>
                ))}
              </div>
            )}
            {e.video_stream_url && (
              <div className="mt-3">
                <a
                  href={addTokenToVideoUrl(e.video_stream_url) ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-secondary/20 px-2.5 py-1.5 text-sm text-foreground/90 transition-colors hover:bg-primary/20 hover:text-foreground"
                >
                  <Film className="h-4 w-4 shrink-0" />
                  Смотреть видео
                </a>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={props.onEdit}>
              <Pencil className="h-4 w-4" />
              Редактировать
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="lg" aria-label="Действия">
                  <MoreHorizontal className="h-4 w-4" />
                  Действия
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={props.onEdit}>
                  <Pencil className="h-4 w-4" />
                  Редактировать
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:bg-destructive/15 focus:text-destructive"
                  onSelect={props.onDelete}
                >
                  <Trash2 className="h-4 w-4" />
                  Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
