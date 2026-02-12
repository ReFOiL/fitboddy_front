import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Film, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import {
  addTokenToVideoUrl,
  deleteExercise,
  listExercises,
  queryKeys,
} from '../../api'
import type { ExerciseOut } from '../../types/workout'
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

export function ExercisesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
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

  const filtered = useMemo(() => {
    const list = exercisesQuery.data ?? []
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.equipment ?? '').toLowerCase().includes(q) ||
        e.muscles.some((m) => m.name.toLowerCase().includes(q))
    )
  }, [exercisesQuery.data, search])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Упражнения</h2>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Поиск по названию, оборудованию, мышцам…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={() => navigate('/exercises/new')}>
            <Plus className="h-4 w-4" />
            Создать
          </Button>
        </div>
      </div>

      {exercisesQuery.isLoading && (
        <div className="text-sm text-secondary-foreground/80">Загрузка…</div>
      )}
      {exercisesQuery.isError && (
        <div className="text-sm text-destructive">Ошибка загрузки. Проверь доступность бэкенда.</div>
      )}
      {exercisesQuery.data && filtered.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-secondary-foreground/80">
            {search.trim() ? 'Ничего не найдено' : 'Нет упражнений. Создай первое.'}
          </CardContent>
        </Card>
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
