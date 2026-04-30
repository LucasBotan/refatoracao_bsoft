/**
 * meService — comunicação com o endpoint GET /me/.
 *
 * O backend é a única fonte de verdade sobre o CT do usuário.
 * Nunca confiar em dados locais para essa validação.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export interface MeResponse {
  nome: string
  email: string
  ct: string | null
  nome_centro_trabalho: string | null
  usuario_sem_ct: boolean
}

export async function fetchMe(accessToken: string): Promise<MeResponse> {
  const response = await fetch(`${API_BASE}/me/`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    throw new Error('me_fetch_failed')
  }

  return response.json() as Promise<MeResponse>
}
