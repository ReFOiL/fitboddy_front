import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, RefreshCcw, User } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { getUser, queryKeys } from '../../api'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import type { UserAnswerGroupOut, UserDetailOut } from '../../types/user'

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return value
  return dt.toLocaleString()
}

function formatAnswerValue(answer: UserAnswerGroupOut) {
  if (answer.options && answer.options.length > 0) {
    return answer.options.map((o) => o.label || o.value).join(', ')
  }

  const value = answer.value
  if (value === null || value === undefined) return '—'
  if (typeof value === 'string') return value || '—'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? 'Да' : 'Нет'

  try {
    const json = JSON.stringify(value)
    return json.length > 400 ? `${json.slice(0, 400)}…` : json
  } catch {
    return '[не удалось отобразить]'
  }
}

function parseUserId(raw: string | undefined) {
  if (!raw) return null
  const n = Number(raw)
  if (!Number.isFinite(n)) return null
  const int = Math.trunc(n)
  if (int <= 0) return null
  return int
}

export function UserDetailPage() {
  const navigate = useNavigate()
  const params = useParams()
  const userId = parseUserId(params.id)

  const userQuery = useQuery<UserDetailOut>({
    enabled: userId !== null,
    queryKey: userId === null ? ['users', 'detail', 'invalid'] : queryKeys.users.detail(userId),
    queryFn: async () => {
      if (userId === null) throw new Error('Invalid user id')
      return await getUser(userId)
    },
    networkMode: 'always',
  })

  const answers = useMemo(() => userQuery.data?.answers ?? [], [userQuery.data?.answers])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" onClick={() => navigate('/users')}>
            <ArrowLeft className="h-4 w-4" />
            Назад
          </Button>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Пользователь</h2>
            <div className="text-sm text-secondary-foreground/80">Детали профиля и ответы анкеты</div>
          </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={() => userQuery.refetch()}
          disabled={userQuery.isFetching || userId === null}
          title="Обновить"
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>

      {userId === null ? (
        <Card style={{ backgroundColor: 'var(--surface-section)' }}>
          <CardContent className="p-4 text-sm text-destructive">Некорректный id пользователя.</CardContent>
        </Card>
      ) : userQuery.isLoading ? (
        <Card style={{ backgroundColor: 'var(--surface-section)' }}>
          <CardContent className="p-4 text-sm text-secondary-foreground/80">Загрузка...</CardContent>
        </Card>
      ) : userQuery.isError ? (
        <Card style={{ backgroundColor: 'var(--surface-section)' }}>
          <CardContent className="p-4 text-sm text-destructive">
            Ошибка загрузки. Проверь доступность бэкенда и права админа.
          </CardContent>
        </Card>
      ) : !userQuery.data ? (
        <Card style={{ backgroundColor: 'var(--surface-section)' }}>
          <CardContent className="p-4 text-sm text-secondary-foreground/80">Нет данных.</CardContent>
        </Card>
      ) : (
        <>
          <Card style={{ backgroundColor: 'var(--surface-section)' }}>
            <CardContent className="p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="muted">
                      <User className="h-3 w-3" />
                      id: {userQuery.data.id}
                    </Badge>
                    <Badge variant="warning">tg: {userQuery.data.telegram_id}</Badge>
                    <Badge variant={userQuery.data.has_completed_profile ? 'primary' : 'muted'}>
                      {userQuery.data.has_completed_profile ? 'анкета заполнена' : 'анкета не заполнена'}
                    </Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
                    <div className="rounded-xl border border-border/60 bg-secondary p-4">
                      <div className="text-[11px] font-medium tracking-wide text-secondary-foreground/80">USERNAME</div>
                      <div className="mt-2 truncate text-sm text-foreground">{userQuery.data.username ?? '—'}</div>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-secondary p-4">
                      <div className="text-[11px] font-medium tracking-wide text-secondary-foreground/80">СОЗДАН</div>
                      <div className="mt-2 text-sm text-foreground">{formatDate(userQuery.data.created_at)}</div>
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-secondary-foreground/70">
                    Профиль завершён: {formatDate(userQuery.data.profile_completed_at)}
                  </div>
                </div>

                <div className="rounded-xl border border-border/70 bg-secondary px-4 py-3 text-sm">
                  <div className="text-secondary-foreground/80">Ответов</div>
                  <div className="mt-1 text-2xl font-semibold">{answers.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card style={{ backgroundColor: 'var(--surface-section)' }}>
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm text-secondary-foreground/80">Анкета</div>
              </div>

              {answers.length === 0 ? (
                <div className="rounded-lg border border-border/70 bg-secondary p-3 text-sm text-secondary-foreground/80">
                  Ответов пока нет.
                </div>
              ) : (
                <div className="space-y-3">
                  {answers.map((a) => (
                    <div
                      key={`${a.question_id}:${a.question_key}`}
                      className="rounded-2xl border border-border/60 bg-secondary p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="muted">#{a.question_id}</Badge>
                        <Badge variant="default">{a.answer_type}</Badge>
                        <Badge variant="muted">
                          <span className="font-mono">{a.question_key}</span>
                        </Badge>
                      </div>

                      <div className="mt-3 whitespace-pre-wrap text-sm font-medium text-foreground">{a.question_text}</div>

                      <div className="mt-3 rounded-xl border border-border/70 bg-secondary p-3">
                        <div className="text-[11px] font-medium tracking-wide text-secondary-foreground/80">ОТВЕТ</div>
                        <div className="mt-2 whitespace-pre-wrap text-sm text-foreground">{formatAnswerValue(a)}</div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-secondary-foreground/70">
                        <span>answered_at: {formatDate(a.answered_at ?? null)}</span>
                        <span>updated_at: {formatDate(a.updated_at ?? null)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

