import axios from 'axios'
import { toast } from 'sonner'

export const ADMIN_TOKEN_KEY = 'admin_token'

function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY)
}

/**
 * Добавляет токен админа в URL для запросов видео (браузер не отправляет заголовки при загрузке через <video src>).
 */
/**
 * Добавляет токен админа в URL для запросов видео (браузер не отправляет заголовки при загрузке через <video src>).
 */
export function addTokenToVideoUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const token = getAdminToken()
  if (!token) return url
  // Если токен уже есть в URL, не добавляем повторно
  if (url.includes('token=')) return url
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}token=${encodeURIComponent(token)}`
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
  // FormData должен уходить с multipart/form-data и boundary — не перезаписывать Content-Type
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
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

