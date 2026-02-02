import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, RefreshCcw, Search, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { listUsers, queryKeys } from '../../api'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import type { UserOut } from '../../types/user'

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return value
  return dt.toLocaleString()
}

export function UsersPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const usersQuery = useQuery<UserOut[]>({
    queryKey: queryKeys.users.all,
    queryFn: listUsers,
    networkMode: 'always',
  })

  const rows = useMemo(() => {
    const data = usersQuery.data ?? []
    const q = search.trim().toLowerCase()
    if (!q) return data

    return data.filter((u) => {
      const username = (u.username ?? '').toLowerCase()
      return (
        username.includes(q) ||
        String(u.telegram_id).includes(q) ||
        String(u.id).includes(q) ||
        String(u.has_completed_profile).includes(q)
      )
    })
  }, [search, usersQuery.data])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Пользователи</h2>
          <div className="text-sm text-secondary-foreground/80">Просмотр пользователей и их анкет</div>
        </div>
      </div>

      <Card style={{ backgroundColor: 'var(--surface-section)' }}>
        <CardContent className="p-4">
          <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <Input
                placeholder="Поиск: username / telegram_id / id"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button
                type="button"
                onClick={() => usersQuery.refetch()}
                disabled={usersQuery.isFetching}
                title="Обновить"
                variant="secondary"
                size="lg"
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-sm text-secondary-foreground/80">
              Всего: <span className="font-medium text-foreground">{rows.length}</span>
            </div>
          </div>

          {usersQuery.isLoading ? (
            <div className="rounded-lg border border-border/40 p-3 text-sm text-secondary-foreground/80" style={{ backgroundColor: 'var(--surface-section)' }}>
              Загрузка...
            </div>
          ) : usersQuery.isError ? (
            <div className="rounded-lg border border-border/40 p-3 text-sm text-destructive" style={{ backgroundColor: 'var(--surface-section)' }}>
              Ошибка загрузки. Проверь доступность бэкенда и admin token.
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-lg border border-border/40 p-3 text-sm text-secondary-foreground/80" style={{ backgroundColor: 'var(--surface-section)' }}>
              Ничего не найдено.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {rows.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => navigate(`/users/${u.id}`)}
                  className={[
                    'text-left',
                    'w-full',
                    'rounded-2xl',
                    'transition-transform duration-150 ease-out',
                    'active:scale-[0.99]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55 focus-visible:ring-offset-0',
                  ].join(' ')}
                >
                  <Card
                    className={[
                      'group',
                      'cursor-pointer',
                      'transition-[box-shadow,border-color,background-color] duration-200 ease-out',
                      'hover:border-primary/55',
                      'hover:shadow-[0_18px_46px_rgba(0,0,0,0.45)]',
                    ].join(' ')}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="muted">
                              <User className="h-3 w-3" />
                              id: {u.id}
                            </Badge>
                            <Badge variant="warning">tg: {u.telegram_id}</Badge>
                            <Badge variant={u.has_completed_profile ? 'primary' : 'muted'}>
                              {u.has_completed_profile ? 'анкета заполнена' : 'анкета не заполнена'}
                            </Badge>
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                            <div className="rounded-xl border border-border/60 bg-secondary p-4">
                              <div className="text-[11px] font-medium tracking-wide text-secondary-foreground/80">
                                USERNAME
                              </div>
                              <div className="mt-2 truncate text-sm text-foreground">{u.username ?? '—'}</div>
                            </div>

                            <div className="rounded-xl border border-border/60 bg-secondary p-4">
                              <div className="text-[11px] font-medium tracking-wide text-secondary-foreground/80">
                                СОЗДАН
                              </div>
                              <div className="mt-2 text-sm text-foreground">{formatDate(u.created_at)}</div>
                            </div>
                          </div>

                          <div className="mt-2 text-xs text-secondary-foreground/70">
                            Профиль завершён: {formatDate(u.profile_completed_at)}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-secondary-foreground/70">
                          <Search className="h-4 w-4 opacity-60" />
                          <ChevronRight className="h-4 w-4 opacity-60" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

