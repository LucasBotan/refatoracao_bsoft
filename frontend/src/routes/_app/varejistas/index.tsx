import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useUserCT } from '@/hooks/useUserCT'
import { Button } from '@/components/ui/button'
import {
  listarVarejistas,
  deletarVarejista,
  type Varejista,
} from '@/services/varejistasService'
import { formatarCnpj } from '@/components/varejistas/VarejistasForm'

export const Route = createFileRoute('/_app/varejistas/')({
  component: VarejistasListPage,
})

function VarejistasListPage() {
  const { accessToken } = useAuth()
  const { userCT } = useUserCT()
  const navigate = useNavigate()

  const [varejistas, setVarejistas] = useState<Varejista[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [deletando, setDeletando] = useState<number | null>(null)

  const carregarVarejistas = useCallback(async () => {
    if (!accessToken) return
    setCarregando(true)
    setErro(null)
    try {
      const filtros = userCT?.ct ? { ct: userCT.ct } : undefined
      const resp = await listarVarejistas(accessToken, filtros)
      setVarejistas(resp.results)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao carregar varejistas.')
    } finally {
      setCarregando(false)
    }
  }, [accessToken, userCT?.ct])

  useEffect(() => {
    carregarVarejistas()
  }, [carregarVarejistas])

  async function handleDeletar(id: number) {
    if (!accessToken) return
    if (!window.confirm('Deseja realmente excluir este varejista?')) return

    setDeletando(id)
    try {
      await deletarVarejista(accessToken, id)
      await carregarVarejistas()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao excluir varejista.')
      setDeletando(null)
    }
  }

  return (
    <div className="space-y-5 p-6">

      {/* ── Cabeçalho ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Varejistas</h2>
          <p className="text-sm text-muted-foreground">Gerenciar cadastro de varejistas</p>
        </div>
        <Button onClick={() => navigate({ to: '/varejistas/novo' })}>
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Novo Varejista
        </Button>
      </div>

      {/* ── Erro ───────────────────────────────────────────────────── */}
      {erro && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {erro}
        </div>
      )}

      {/* ── Tabela ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-background shadow-sm overflow-hidden">
        {carregando ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Carregando" />
          </div>
        ) : varejistas.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Nenhum varejista cadastrado.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Nome
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">
                  CNPJ
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">
                  Cidade / UF
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {varejistas.map((v) => (
                <tr key={v.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">{v.id}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{v.nome}</td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground hidden sm:table-cell">
                    {formatarCnpj(v.cnpj)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {[v.cidade, v.estado].filter(Boolean).join(' / ')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          navigate({
                            to: '/varejistas/$id',
                            params: { id: String(v.id) },
                          })
                        }
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeletar(v.id)}
                        disabled={deletando === v.id}
                        className="text-destructive hover:text-destructive hover:border-destructive/50"
                      >
                        {deletando === v.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                        )}
                        {deletando === v.id ? 'Excluindo…' : 'Apagar'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
