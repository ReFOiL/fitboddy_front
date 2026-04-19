import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth } from '../hooks/use-auth'

export function SuperuserRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isSuperuser } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  if (!isSuperuser) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}
