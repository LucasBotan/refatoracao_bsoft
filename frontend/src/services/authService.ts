/**
 * authService — encapsula toda comunicação HTTP relacionada a autenticação.
 *
 * Responsabilidade única: fazer as chamadas de rede. Nenhuma lógica de
 * estado, roteamento ou UI deve residir aqui.
 *
 * Tokens são recebidos por parâmetro e nunca lidos de storage neste módulo.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export interface AuthUser {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  microsoft_id: string
  /** Nomes dos grupos Azure AD sincronizados a cada login. */
  microsoft_groups: string[]
}

export interface TokenPair {
  access_token: string
  refresh_token: string
}

/** URL que inicia o fluxo OAuth2. O navegador é redirecionado para lá. */
export function getLoginUrl(): string {
  return `${API_BASE}/auth/login/`
}

/**
 * Renova o access_token usando o refresh_token.
 *
 * Risco documentado: o refresh_token é armazenado em sessionStorage pelo
 * AuthContext para sobreviver a recarregamentos de página dentro da mesma
 * sessão de aba. Não persiste entre abas nem após fechar o browser.
 * Migrar para cookie HttpOnly em produção via BFF.
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenPair> {
  const response = await fetch(`${API_BASE}/auth/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: refreshToken }),
  })

  if (!response.ok) {
    throw new Error('refresh_failed')
  }

  const data = await response.json() as { access: string; refresh?: string }
  return {
    access_token: data.access,
    refresh_token: data.refresh ?? refreshToken,
  }
}

/** Busca o perfil do usuário autenticado via Bearer token. */
export async function fetchProfile(accessToken: string): Promise<AuthUser> {
  const response = await fetch(`${API_BASE}/auth/profile/`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    throw new Error('profile_fetch_failed')
  }

  return response.json() as Promise<AuthUser>
}
