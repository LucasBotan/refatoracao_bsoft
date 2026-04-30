import { useContext } from 'react'
import { UserContext } from '@/contexts/UserContext'

export function useUserCT() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUserCT must be used inside UserProvider')
  return ctx
}
