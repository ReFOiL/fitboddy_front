import { create } from 'zustand'

import { ADMIN_ACCESS_TOKEN_KEY } from '../api/client'

const ADMIN_IS_SUPERUSER_KEY = 'admin_is_superuser'
const ADMIN_USERNAME_KEY = 'admin_username'

export type AuthTokens = {
  accessToken: string
  isSuperuser: boolean
  /** Логин, под которым вошли (для UI; при смене логина суперпользователем обновляется вручную). */
  username: string
}

type AuthState = {
  tokens: AuthTokens | null
  setTokens: (tokens: AuthTokens | null) => void
  logout: () => void
}

function loadTokens(): AuthTokens | null {
  const accessToken = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY)
  if (!accessToken) return null
  const isSuperuser = localStorage.getItem(ADMIN_IS_SUPERUSER_KEY) === '1'
  const username = localStorage.getItem(ADMIN_USERNAME_KEY) ?? ''
  return { accessToken, isSuperuser, username }
}

function persistTokens(tokens: AuthTokens | null) {
  if (!tokens) {
    localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY)
    localStorage.removeItem(ADMIN_IS_SUPERUSER_KEY)
    localStorage.removeItem(ADMIN_USERNAME_KEY)
    return
  }
  localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, tokens.accessToken)
  localStorage.setItem(ADMIN_IS_SUPERUSER_KEY, tokens.isSuperuser ? '1' : '0')
  localStorage.setItem(ADMIN_USERNAME_KEY, tokens.username)
}

export const useAuthStore = create<AuthState>((set) => ({
  tokens: loadTokens(),
  setTokens: (tokens) => {
    persistTokens(tokens)
    set({ tokens })
  },
  logout: () => {
    persistTokens(null)
    set({ tokens: null })
  },
}))
