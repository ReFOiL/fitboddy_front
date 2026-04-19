import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, RefreshCcw, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import {
  createAdminAccount,
  deleteAdminAccount,
  listAdminAccounts,
  queryKeys,
  updateAdminAccount,
  type AdminAccountOut,
} from '../../api'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader } from '../../components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { useAuthStore } from '../../stores/auth.store'

const createSchema = z.object({
  username: z.string().min(2, 'Минимум 2 символа'),
  password: z.string().min(8, 'Минимум 8 символов'),
})

const editSchema = z.object({
  username: z.string().min(2, 'Минимум 2 символа'),
  password: z.string(),
})

type CreateForm = z.infer<typeof createSchema>
type EditForm = z.infer<typeof editSchema>

function canDeleteAccount(
  account: AdminAccountOut,
  currentUsername: string,
  superuserCount: number,
): boolean {
  if (account.username === currentUsername) return false
  if (account.is_superuser && superuserCount <= 1) return false
  return true
}

export function AdminAccountsPage() {
  const qc = useQueryClient()
  const sessionUsername = useAuthStore((s) => s.tokens?.username ?? '')
  const setTokens = useAuthStore((s) => s.setTokens)

  const [editing, setEditing] = useState<AdminAccountOut | null>(null)

  const form = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { username: '', password: '' },
  })

  const editForm = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: { username: '', password: '' },
  })

  useEffect(() => {
    if (editing) {
      editForm.reset({ username: editing.username, password: '' })
    }
  }, [editing, editForm])

  const listQuery = useQuery({
    queryKey: queryKeys.adminAccounts.all,
    queryFn: listAdminAccounts,
    networkMode: 'always',
  })

  const createMut = useMutation({
    mutationFn: createAdminAccount,
    onSuccess: async () => {
      toast.success('Администратор создан')
      form.reset()
      await qc.invalidateQueries({ queryKey: queryKeys.adminAccounts.all })
    },
  })

  const updateMut = useMutation({
    mutationFn: (vars: {
      id: number
      previousUsername: string
      payload: { username?: string; password?: string }
    }) => updateAdminAccount(vars.id, vars.payload),
    onSuccess: async (data, vars) => {
      if (sessionUsername && vars.previousUsername === sessionUsername && data.username !== sessionUsername) {
        const t = useAuthStore.getState().tokens
        if (t) setTokens({ ...t, username: data.username })
      }
      toast.success('Изменения сохранены')
      setEditing(null)
      await qc.invalidateQueries({ queryKey: queryKeys.adminAccounts.all })
    },
  })

  const deleteMut = useMutation({
    mutationFn: deleteAdminAccount,
    onSuccess: async () => {
      toast.success('Учётная запись удалена')
      await qc.invalidateQueries({ queryKey: queryKeys.adminAccounts.all })
    },
  })

  const accounts = listQuery.data ?? []
  const superuserCount = accounts.filter((a) => a.is_superuser).length

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Администраторы</h2>
        <p className="text-sm text-secondary-foreground/80">
          Учётные записи входа в админку. Создавать, менять и удалять может только суперпользователь.
        </p>
      </div>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Изменить учётную запись</DialogTitle>
          </DialogHeader>
          {editing ? (
            <form
              className="space-y-3"
              onSubmit={editForm.handleSubmit((values) => {
                const payload: { username?: string; password?: string } = {}
                if (values.username.trim() !== editing.username) {
                  payload.username = values.username.trim()
                }
                if (values.password.length > 0) {
                  if (values.password.length < 8) {
                    toast.error('Пароль — минимум 8 символов')
                    return
                  }
                  payload.password = values.password
                }
                if (Object.keys(payload).length === 0) {
                  toast.error('Измените логин и/или укажите новый пароль')
                  return
                }
                updateMut.mutate({
                  id: editing.id,
                  previousUsername: editing.username,
                  payload,
                })
              })}
            >
              <div className="space-y-1">
                <label className="text-xs text-secondary-foreground">Логин</label>
                <Input autoComplete="off" {...editForm.register('username')} />
                {editForm.formState.errors.username?.message ? (
                  <p className="text-xs text-destructive">{editForm.formState.errors.username.message}</p>
                ) : null}
              </div>
              <div className="space-y-1">
                <label className="text-xs text-secondary-foreground">Новый пароль (необязательно)</label>
                <Input type="password" autoComplete="new-password" {...editForm.register('password')} />
              </div>
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                  Отмена
                </Button>
                <Button type="submit" disabled={updateMut.isPending}>
                  {updateMut.isPending ? 'Сохранение…' : 'Сохранить'}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="p-5 pb-0">
          <h3 className="text-sm font-medium">Новый администратор</h3>
        </CardHeader>
        <CardContent className="p-5 pt-3">
          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={form.handleSubmit((values) =>
              createMut.mutateAsync({ username: values.username.trim(), password: values.password }),
            )}
          >
            <div className="flex-1 space-y-1">
              <label className="text-xs text-secondary-foreground">Логин</label>
              <Input autoComplete="off" {...form.register('username')} />
              {form.formState.errors.username?.message ? (
                <p className="text-xs text-destructive">{form.formState.errors.username.message}</p>
              ) : null}
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-xs text-secondary-foreground">Пароль</label>
              <Input type="password" autoComplete="new-password" {...form.register('password')} />
              {form.formState.errors.password?.message ? (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              ) : null}
            </div>
            <Button type="submit" disabled={createMut.isPending}>
              {createMut.isPending ? 'Создание…' : 'Создать'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-end">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              title="Обновить"
              onClick={() => listQuery.refetch()}
              disabled={listQuery.isFetching}
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>

          {listQuery.isLoading ? (
            <p className="text-sm text-secondary-foreground/80">Загрузка…</p>
          ) : listQuery.isError ? (
            <p className="text-sm text-destructive">Не удалось загрузить список.</p>
          ) : (
            <ul className="divide-y divide-border/40">
              {accounts.map((a) => {
                const allowDelete = canDeleteAccount(a, sessionUsername, superuserCount)
                const delTitle = !allowDelete
                  ? a.username === sessionUsername
                    ? 'Нельзя удалить свою учётную запись'
                    : a.is_superuser && superuserCount <= 1
                      ? 'Нельзя удалить последнего суперпользователя'
                      : undefined
                  : 'Удалить'
                return (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <span className="font-medium">{a.username}</span>
                    <div className="flex flex-wrap items-center gap-2">
                      {a.is_superuser ? <Badge variant="primary">Супер</Badge> : null}
                      <span className="text-xs text-secondary-foreground/80">
                        {new Date(a.created_at).toLocaleString()}
                      </span>
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        title="Изменить логин или пароль"
                        onClick={() => setEditing(a)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        title={delTitle}
                        disabled={!allowDelete || deleteMut.isPending}
                        onClick={() => {
                          if (!window.confirm(`Удалить учётную запись «${a.username}»?`)) return
                          deleteMut.mutate(a.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
