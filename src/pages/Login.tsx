import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'

import { useAuthStore } from '../stores/auth.store'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { Input } from '../components/ui/input'

const loginSchema = z.object({
  username: z.string().min(1, 'Введите логин'),
  password: z.string().min(1, 'Введите пароль'),
})

type LoginForm = z.infer<typeof loginSchema>

type LoginResponse = {
  access_token: string
  token_type: string
  expires_in: number
  is_superuser: boolean
}

export function LoginPage() {
  const navigate = useNavigate()
  const setTokens = useAuthStore((s) => s.setTokens)

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  })

  const baseURL = import.meta.env.VITE_API_URL || ''

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
                try {
                  const { data } = await axios.post<LoginResponse>(
                    `${baseURL}/admin/auth/login`,
                    {
                      username: values.username.trim(),
                      password: values.password,
                    },
                    { headers: { 'Content-Type': 'application/json' }, timeout: 15_000 },
                  )
                  setTokens({
                    accessToken: data.access_token,
                    isSuperuser: data.is_superuser,
                    username: values.username.trim(),
                  })
                  navigate('/dashboard', { replace: true })
                } catch (err) {
                  const detail = axios.isAxiosError(err)
                    ? (err.response?.data as { detail?: string } | undefined)?.detail
                    : undefined
                  toast.error(detail ?? 'Не удалось войти')
                }
              })}
            >
              <div className="space-y-1">
                <label className="text-sm">Логин</label>
                <Input autoComplete="username" {...form.register('username')} />
                {form.formState.errors.username?.message ? (
                  <div className="text-sm text-destructive">{form.formState.errors.username.message}</div>
                ) : null}
              </div>
              <div className="space-y-1">
                <label className="text-sm">Пароль</label>
                <Input type="password" autoComplete="current-password" {...form.register('password')} />
                {form.formState.errors.password?.message ? (
                  <div className="text-sm text-destructive">{form.formState.errors.password.message}</div>
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
