/**
 * authz.ts — camada central de autorização de UI.
 *
 * Mapeia microsoft_groups do Azure AD para capabilities (capacidades) de
 * forma tipada e case-insensitive. É a ÚNICA fonte de verdade para regras
 * de visibilidade no frontend — nenhum componente deve comparar grupos
 * diretamente.
 *
 * Princípio: a UI apenas reflete permissões. A proteção real reside nas
 * permission_classes do DRF (authentication/permissions.py → IsInGroup).
 *
 * Pressupostos:
 *   - Grupos vêm de AuthUser.microsoft_groups (string[]) via /auth/profile/.
 *   - Comparação é case-insensitive (consistente com User.is_in_ms_group).
 *   - Array vazio de grupos requeridos = visível para qualquer autenticado.
 *   - Ajuste CAPABILITY_GROUPS conforme grupos reais do Azure AD da org.
 */

export type Capability =
  | 'view_dashboard'
  | 'view_ordens'
  | 'view_apontamentos'
  | 'view_maquinas'
  | 'view_qualidade'
  | 'view_estoque'
  | 'view_manutencao'
  | 'view_relatorios'
  | 'view_usuarios'
  | 'view_configuracoes'

/**
 * Mapeamento capability → grupos que a concedem.
 *
 * Array vazio = visível para qualquer usuário autenticado.
 * Nomes são normalizados para uppercase na comparação.
 *
 * Referência backend: authentication/permissions.py (IsInGroup)
 * Grupos observados: ADMIN, FINANCEIRO (via FinanceView, AdminOnlyView)
 */
const CAPABILITY_GROUPS: Record<Capability, string[]> = {
  // Módulos operacionais — acessíveis a todos os autenticados
  view_dashboard:    [],
  view_ordens:       [],
  view_apontamentos: [],
  view_maquinas:     [],
  view_qualidade:    [],

  // Módulos de gestão — requerem grupo específico ou ADMIN
  view_estoque:      ['ESTOQUE', 'ADMIN'],
  view_manutencao:   ['MANUTENCAO', 'MANUTENCÃO', 'ADMIN'],
  view_relatorios:   ['FINANCEIRO', 'GESTAO', 'GESTÃO', 'ADMIN'],
  view_usuarios:     ['ADMIN'],
  view_configuracoes: ['ADMIN'],
}

/**
 * Retorna se o usuário tem uma capability dado seu array de grupos Azure AD.
 *
 * @param capability  Capability a verificar
 * @param userGroups  microsoft_groups do usuário autenticado
 */
export function hasCapability(capability: Capability, userGroups: string[]): boolean {
  const required = CAPABILITY_GROUPS[capability]
  if (required.length === 0) return true
  const upperGroups = userGroups.map((g) => g.toUpperCase())
  return required.some((r) => upperGroups.includes(r.toUpperCase()))
}

/** Deriva o conjunto completo de capabilities para um array de grupos. */
export function deriveCapabilities(userGroups: string[]): Set<Capability> {
  return new Set(
    (Object.keys(CAPABILITY_GROUPS) as Capability[]).filter((cap) =>
      hasCapability(cap, userGroups),
    ),
  )
}
