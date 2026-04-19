import axios from 'axios'
import { toast } from 'sonner'

export const ADMIN_ACCESS_TOKEN_KEY = 'admin_access_token'

function getAccessToken(): string | null {
  return localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY)
}

/**
 * Для &lt;video src&gt;: браузер не шлёт Authorization — передаём JWT в query `token`.
 */
export function addTokenToVideoUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const token = getAccessToken()
  if (!token) return url
  if (url.includes('token=')) return url
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}token=${encodeURIComponent(token)}`
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status as number | undefined

    if (status === 403) {
      localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY)
      localStorage.removeItem('admin_is_superuser')
      localStorage.removeItem('admin_username')
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
