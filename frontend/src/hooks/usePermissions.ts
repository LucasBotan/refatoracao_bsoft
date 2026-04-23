/**
 * usePermissions — expõe as capabilities do usuário autenticado.
 *
 * Centraliza a lógica de autorização de UI: componentes e menus não
 * devem comparar microsoft_groups diretamente — usam este hook.
 *
 * Baseado em lib/authz.ts que é a fonte de verdade do mapeamento
 * grupo → capability.
 */
import { useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { deriveCapabilities, type Capability } from '@/lib/authz'

export function usePermissions() {
  const { user } = useAuth()
  const groups = user?.microsoft_groups ?? []

  const capabilities = useMemo(() => deriveCapabilities(groups), [groups])

  return {
    /** Retorna true se o usuário tiver a capability especificada. */
    can: (cap: Capability): boolean => capabilities.has(cap),
    capabilities,
  }
}
