import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { useAuthStore } from '../stores/auth.store'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { Input } from '../components/ui/input'

const loginSchema = z.object({
  adminToken: z.string().min(1, 'Введите admin token'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const setTokens = useAuthStore((s) => s.setTokens)

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { adminToken: '' },
  })

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
        <Card>
          <CardHeader className="p-5 pb-0">
            <h1 className="text-2xl font-semibold tracking-tight">Вход</h1>
            <p className="mt-1 text-sm text-secondary-foreground/80">Админка Fitboddy Bot</p>
          </CardHeader>
          <CardContent className="p-5">
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit(async (values) => {
                // На бэкенде доступ в админку проверяется заголовком `x-admin-token`.
                setTokens({ adminToken: values.adminToken })
                navigate('/dashboard', { replace: true })
              })}
            >
              <div className="space-y-1">
                <label className="text-sm">Admin token</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...form.register('adminToken')}
                />
                {form.formState.errors.adminToken?.message ? (
                  <div className="text-sm text-destructive">{form.formState.errors.adminToken.message}</div>
                ) : null}
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
                Войти
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

