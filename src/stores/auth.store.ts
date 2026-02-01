import { create } from 'zustand'
import { ADMIN_TOKEN_KEY } from '../api/client'

export type AuthTokens = {
  adminToken: string
}

type AuthState = {
  tokens: AuthTokens | null
  setTokens: (tokens: AuthTokens | null) => void
  logout: () => void
}

function loadTokens(): AuthTokens | null {
  const adminToken = localStorage.getItem(ADMIN_TOKEN_KEY)
  if (!adminToken) return null
  return { adminToken }
}

function persistTokens(tokens: AuthTokens | null) {
  if (!tokens) {
    localStorage.removeItem(ADMIN_TOKEN_KEY)
    return
  }
  localStorage.setItem(ADMIN_TOKEN_KEY, tokens.adminToken)
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

