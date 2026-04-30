/**
 * notaFiscalService — comunicação HTTP do módulo de entrada de NF-e.
 *
 * Funções puras que recebem accessToken por parâmetro.
 * Nenhum estado, roteamento ou UI reside aqui.
 * O CT nunca é enviado — o backend obtém de request.user.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface NotaPreview {
  numero: string
  serie: string
  chave_acesso: string
  protocolo: string
  data_emissao: string
  valor_total: string
  varejista_id: number
  observacao?: string
}

export interface ItemPreview {
  codigo_varejo: string
  descricao: string
  ean: string
  ncm: string
  quantidade: number
  valor_unitario: string
  status: 'OK' | 'NAO_CADASTRADO'
  gera_saida: boolean
  quantidade_restante: number
}

export interface ImportarXMLResponse {
  nota: NotaPreview
  itens: ItemPreview[]
  pode_concluir: boolean
}

export interface ValidarItensResponse {
  itens: ItemPreview[]
  pode_concluir: boolean
}

export interface ConsolidarResponse {
  itens: ItemPreview[]
}

export type ApiErro = Record<string, string | string[]>

// ── Helpers ───────────────────────────────────────────────────────────────────

function authHeaders(accessToken: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  }
}

async function handleError(response: Response): Promise<never> {
  if (response.status === 400) {
    const body = (await response.json()) as ApiErro
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    throw body
  }
  throw new Error(`Erro ${response.status}: ${response.statusText}`)
}

// ── Endpoints ─────────────────────────────────────────────────────────────────

export async function importarXML(
  accessToken: string,
  payload: { xml: string; varejista_id: number },
): Promise<ImportarXMLResponse> {
  const response = await fetch(`${API_BASE}/notas/importar-xml/`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify(payload),
  })
  if (!response.ok) return handleError(response)
  return response.json() as Promise<ImportarXMLResponse>
}

export async function validarItens(
  accessToken: string,
  payload: { varejista_id: number; itens: ItemPreview[] },
): Promise<ValidarItensResponse> {
  const response = await fetch(`${API_BASE}/notas/validar/`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify(payload),
  })
  if (!response.ok) return handleError(response)
  return response.json() as Promise<ValidarItensResponse>
}

export async function consolidar(
  accessToken: string,
  payload: { itens: ItemPreview[] },
): Promise<ConsolidarResponse> {
  const response = await fetch(`${API_BASE}/notas/consolidar/`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify(payload),
  })
  if (!response.ok) return handleError(response)
  return response.json() as Promise<ConsolidarResponse>
}

export async function salvarNota(
  accessToken: string,
  payload: { nota: NotaPreview; itens: ItemPreview[]; varejista_id: number },
): Promise<unknown> {
  const response = await fetch(`${API_BASE}/notas/salvar/`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify(payload),
  })
  if (!response.ok) return handleError(response)
  return response.json()
}

export async function cadastrarCodigoCliente(
  accessToken: string,
  payload: { codigo: string; varejista_id: number; necessita_saida: boolean },
): Promise<unknown> {
  const response = await fetch(`${API_BASE}/codigo-cliente/`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify(payload),
  })
  if (!response.ok) return handleError(response)
  return response.json()
}
