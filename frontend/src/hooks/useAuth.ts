import { useContext } from 'react'
import { AuthContext, type AuthState } from '@/contexts/AuthContext'

/** Acessa o estado de autenticação. Lança erro se usado fora de AuthProvider. */
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (ctx === null) {
    throw new Error('useAuth deve ser usado dentro de <AuthProvider>.')
  }
  return ctx
}
