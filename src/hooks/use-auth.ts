import { useAuthStore } from '../stores/auth.store'

export function useAuth() {
  const tokens = useAuthStore((s) => s.tokens)
  const setTokens = useAuthStore((s) => s.setTokens)
  const logout = useAuthStore((s) => s.logout)

  return {
    isAuthenticated: Boolean(tokens?.adminToken),
    tokens,
    setTokens,
    logout,
  }
}

