/**
 * UserContext — estado global do Centro de Trabalho do usuário.
 *
 * Busca GET /me/ sempre que o usuário se autentica e expõe os dados
 * de CT para toda a árvore de componentes. Em caso de falha no /me/,
 * força logout — o backend é a única fonte de verdade.
 */
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { fetchMe, type MeResponse } from '@/services/meService'

export interface UserCTState {
  userCT: MeResponse | null
  isLoadingCT: boolean
}

export const UserContext = createContext<UserCTState | null>(null)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, accessToken, logout } = useAuth()

  const [userCT, setUserCT] = useState<MeResponse | null>(null)
  const [isLoadingCT, setIsLoadingCT] = useState(false)

  const loadUserCT = useCallback(
    (token: string) => {
      setIsLoadingCT(true)
      fetchMe(token)
        .then(setUserCT)
        .catch(() => logout())
        .finally(() => setIsLoadingCT(false))
    },
    [logout],
  )

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      setUserCT(null)
      setIsLoadingCT(false)
      return
    }

    loadUserCT(accessToken)
  }, [isAuthenticated, accessToken, loadUserCT])

  const value = useMemo<UserCTState>(
    () => ({ userCT, isLoadingCT }),
    [userCT, isLoadingCT],
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}
