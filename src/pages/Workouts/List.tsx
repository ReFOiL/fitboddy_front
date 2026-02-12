import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import {
  deleteWorkoutTemplate,
  listWorkoutTemplates,
  queryKeys,
} from '../../api'
import type { WorkoutTemplateOut } from '../../types/workout'
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

const DIFFICULTY_LABELS: Record<WorkoutTemplateOut['difficulty'], string> = {
  low: 'Лёгкая',
  medium: 'Средняя',
  high: 'Высокая',
}

export function WorkoutsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<WorkoutTemplateOut | null>(null)

  const templatesQuery = useQuery({
    queryKey: queryKeys.workoutTemplates.all,
    queryFn: listWorkoutTemplates,
    networkMode: 'always',
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteWorkoutTemplate(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.workoutTemplates.all })
      setConfirmDelete(null)
      toast.success('Шаблон удалён')
    },
  })

  const filtered = useMemo(() => {
    const list = templatesQuery.data ?? []
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.goal.toLowerCase().includes(q) ||
        (t.equipment ?? '').toLowerCase().includes(q)
    )
  }, [templatesQuery.data, search])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Шаблоны тренировок</h2>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Поиск по названию, цели, оборудованию…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={() => navigate('/workouts/new')}>
            <Plus className="h-4 w-4" />
            Создать
          </Button>
        </div>
      </div>

      {templatesQuery.isLoading && (
        <div className="text-sm text-secondary-foreground/80">Загрузка…</div>
      )}
      {templatesQuery.isError && (
        <div className="text-sm text-destructive">Ошибка загрузки. Проверь доступность бэкенда.</div>
      )}
      {templatesQuery.data && filtered.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-secondary-foreground/80">
            {search.trim() ? 'Ничего не найдено' : 'Нет шаблонов. Создай первый.'}
          </CardContent>
        </Card>
      )}

      {filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              onEdit={() => navigate(`/workouts/${t.id}/edit`)}
              onDelete={() => setConfirmDelete(t)}
            />
          ))}
        </div>
      )}

      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить шаблон?</DialogTitle>
            <DialogDescription>
              «{confirmDelete?.title}» будет удалён. Это действие нельзя отменить.
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

function TemplateCard(props: {
  template: WorkoutTemplateOut
  onEdit: () => void
  onDelete: () => void
}) {
  const t = props.template
  const exerciseCount = t.workout_exercises?.length ?? 0

  return (
    <Card className="transition-[box-shadow,border-color,background-color] duration-200 ease-out hover:border-primary/30 hover:bg-card/80 hover:shadow-[0_18px_60px_rgba(0,0,0,0.32)]">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="muted">#{t.id}</Badge>
              <Badge variant={t.is_active ? 'primary' : 'muted'}>
                {t.is_active ? 'активен' : 'неактивен'}
              </Badge>
              <Badge variant="default">{DIFFICULTY_LABELS[t.difficulty]}</Badge>
              <Badge variant="default">{t.goal}</Badge>
            </div>
            <h3 className="mt-3 text-lg font-semibold">{t.title}</h3>
            {t.description ? (
              <p className="mt-2 line-clamp-2 text-sm text-secondary-foreground/80">{t.description}</p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-secondary-foreground/75">
              <span>Дней в неделю: {t.days_per_week}</span>
              {t.equipment ? <span>Оборудование: {t.equipment}</span> : null}
              <span>Упражнений: {exerciseCount}</span>
            </div>
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

