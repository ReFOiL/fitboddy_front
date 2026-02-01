import axios from 'axios'
import { toast } from 'sonner'

export const ADMIN_TOKEN_KEY = 'admin_token'

function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY)
}

export const apiClient = axios.create({
  // Если VITE_API_URL пустой, запросы уйдут на origin (Vite proxy обработает /admin/*).
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = getAdminToken()
  if (token) {
    config.headers['x-admin-token'] = token
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status as number | undefined

    // FastAPI web_admin/auth.py возвращает 403 при неверном/пустом токене
    if (status === 403) {
      localStorage.removeItem(ADMIN_TOKEN_KEY)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    const message =
      (error?.response?.data?.detail as string | undefined) ||
      (error?.response?.data?.message as string | undefined) ||
      (typeof error?.message === 'string' && error.message ? error.message : undefined) ||
      'Ошибка сети'
    toast.error(message)

    return Promise.reject(error)
  },
)

