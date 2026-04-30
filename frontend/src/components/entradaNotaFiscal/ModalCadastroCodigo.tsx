import { useState } from 'react'
import { X, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { cadastrarCodigoCliente, type ItemPreview, type ApiErro } from '@/services/notaFiscalService'

interface ModalCadastroCodigoProps {
  item: ItemPreview
  varejista_id: number
  onSalvo: () => void
  onFechar: () => void
}

function extrairMensagemErro(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as ApiErro
    if (e._form) return String(Array.isArray(e._form) ? e._form[0] : e._form)
    if (e.codigo) return String(Array.isArray(e.codigo) ? e.codigo[0] : e.codigo)
    if (e.detail) return String(e.detail)
  }
  if (err instanceof Error) return err.message
  return 'Erro ao cadastrar. Tente novamente.'
}

export function ModalCadastroCodigo({
  item,
  varejista_id,
  onSalvo,
  onFechar,
}: ModalCadastroCodigoProps) {
  const { accessToken } = useAuth()

  const [necessitaSaida, setNecessitaSaida] = useState(true)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleSalvar() {
    if (!accessToken) return
    setCarregando(true)
    setErro(null)

    try {
      await cadastrarCodigoCliente(accessToken, {
        codigo: item.codigo_varejo,
        varejista_id,
        necessita_saida: necessitaSaida,
      })
      onSalvo()
    } catch (err) {
      setErro(extrairMensagemErro(err))
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => e.target === e.currentTarget && onFechar()}
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-background shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 id="modal-title" className="text-sm font-semibold text-foreground">
            Cadastrar Código de Produto
          </h2>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar modal"
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-5 py-4">

          {/* Item info (read-only) */}
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              Produto
            </p>
            <p className="text-sm font-semibold text-foreground font-mono">
              {item.codigo_varejo}
            </p>
            <p className="text-xs text-muted-foreground truncate" title={item.descricao}>
              {item.descricao}
            </p>
          </div>

          {/* Necessita saída */}
          <div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={necessitaSaida}
                onChange={(e) => setNecessitaSaida(e.target.checked)}
                disabled={carregando}
                className="mt-0.5 h-4 w-4 rounded border-input accent-primary cursor-pointer"
              />
              <div>
                <span className="text-sm font-medium text-foreground">Necessita saída</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Quando marcado, o item gera lançamento de saída ao salvar a nota.
                </p>
              </div>
            </label>
          </div>

          {/* Error */}
          {erro && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
            >
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              {erro}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={onFechar}
            disabled={carregando}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSalvar}
            disabled={carregando}
          >
            {carregando ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                Salvando…
              </>
            ) : (
              'Cadastrar Código'
            )}
          </Button>
        </div>

      </div>
    </div>
  )
}
