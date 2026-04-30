/**
 * varejistasService — encapsula toda comunicação HTTP do módulo de varejistas.
 *
 * Padrão idêntico ao authService: funções puras que recebem accessToken por
 * parâmetro. Nenhuma lógica de estado, roteamento ou UI reside aqui.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface Varejista {
  id: number
  nome: string
  cnpj: string
  consumidor: string
  telefone: string
  email: string
  cep: string
  endereco: string
  numero: string
  bairro: string
  complemento: string
  cidade: string
  estado: string
  ct: string
  ativo: boolean
  criado_em: string
  atualizado_em: string
}

export interface CriarVarejistaPayload {
  nome: string
  cnpj: string
  consumidor: string
  telefone: string
  email: string
  cep: string
  endereco: string
  numero: string
  bairro: string
  complemento: string
  cidade: string
  estado: string
  ct: string
}

/** Resposta paginada do DRF (PageNumberPagination). */
export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

/** Erros de validação retornados pelo DRF (campo → mensagens). */
export type ApiValidationErrors = Record<string, string[]>

// ── Helpers ──────────────────────────────────────────────────────────────────

function authHeaders(accessToken: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  }
}

/**
 * Lança um objeto com os erros de validação se a resposta for 400,
 * ou um Error genérico para outros códigos de falha.
 */
async function handleError(response: Response): Promise<never> {
  if (response.status === 400) {
    const body = (await response.json()) as ApiValidationErrors
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    throw body
  }
  throw new Error(`Erro ${response.status}: ${response.statusText}`)
}

// ── Endpoints ────────────────────────────────────────────────────────────────

export async function listarVarejistas(
  accessToken: string,
  filtros?: Record<string, string>,
): Promise<PaginatedResponse<Varejista>> {
  const url = new URL(`${API_BASE}/varejistas/`)
  if (filtros) {
    Object.entries(filtros).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v)
    })
  }

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) return handleError(response)
  return response.json() as Promise<PaginatedResponse<Varejista>>
}

export async function criarVarejista(
  accessToken: string,
  dados: CriarVarejistaPayload,
): Promise<Varejista> {
  const response = await fetch(`${API_BASE}/varejistas/`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify(dados),
  })

  if (!response.ok) return handleError(response)
  return response.json() as Promise<Varejista>
}

export async function buscarVarejista(
  accessToken: string,
  id: number,
): Promise<Varejista> {
  const response = await fetch(`${API_BASE}/varejistas/${id}/`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) return handleError(response)
  return response.json() as Promise<Varejista>
}

export async function atualizarVarejista(
  accessToken: string,
  id: number,
  dados: CriarVarejistaPayload,
): Promise<Varejista> {
  const response = await fetch(`${API_BASE}/varejistas/${id}/`, {
    method: 'PUT',
    headers: authHeaders(accessToken),
    body: JSON.stringify(dados),
  })

  if (!response.ok) return handleError(response)
  return response.json() as Promise<Varejista>
}

export async function deletarVarejista(
  accessToken: string,
  id: number,
): Promise<void> {
  const response = await fetch(`${API_BASE}/varejistas/${id}/`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (response.status === 204) return
  if (!response.ok) return handleError(response)
}
