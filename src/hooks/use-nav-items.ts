import { useMemo } from 'react'

import { navItems, superuserNavItems } from '../lib/constants'
import { useAuthStore } from '../stores/auth.store'

export function useNavItems() {
  const isSuperuser = useAuthStore((s) => s.tokens?.isSuperuser ?? false)
  return useMemo(
    () => [...navItems, ...(isSuperuser ? superuserNavItems : [])],
    [isSuperuser],
  )
}
