import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import {
  Upload,
  CheckCircle2,
  RefreshCw,
  Layers,
  Save,
  AlertCircle,
  Loader2,
  FileText,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { listarVarejistas, type Varejista } from '@/services/varejistasService'
import {
  importarXML,
  validarItens,
  consolidar,
  salvarNota,
  type NotaPreview,
  type ItemPreview,
  type ApiErro,
} from '@/services/notaFiscalService'
import { TabelaItens } from '@/components/entradaNotaFiscal/TabelaItens'
import { ModalCadastroCodigo } from '@/components/entradaNotaFiscal/ModalCadastroCodigo'

export const Route = createFileRoute('/_app/entrada-nota-fiscal')({
  component: EntradaNotaFiscalPage,
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function extrairErro(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as ApiErro
    if (e._form) return String(Array.isArray(e._form) ? e._form[0] : e._form)
    if (e.detail) return String(e.detail)
    const primeiro = Object.values(e)[0]
    if (primeiro) return String(Array.isArray(primeiro) ? primeiro[0] : primeiro)
  }
  if (err instanceof Error) return err.message
  return 'Erro inesperado. Tente novamente.'
}

function lerArquivoXML(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve((e.target?.result as string) ?? '')
    reader.onerror = reject
    reader.readAsText(file, 'UTF-8')
  })
}

function formatarMoeda(valor: string | number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(valor))
}

function formatarData(data: string): string {
  return new Date(data).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const inputSelectClass = cn(
  'mt-0.5 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground',
  'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
  'disabled:cursor-not-allowed disabled:opacity-50',
)

// ── Componente ────────────────────────────────────────────────────────────────

function EntradaNotaFiscalPage() {
  const { accessToken } = useAuth()

  const [varejistas, setVarejistas] = useState<Varejista[]>([])
  const [varejistaSelecionado, setVarejistaSelecionado] = useState<number | ''>('')
  const [arquivo, setArquivo] = useState<File | null>(null)

  const [nota, setNota] = useState<NotaPreview | null>(null)
  const [itens, setItens] = useState<ItemPreview[]>([])
  const [podeConcluir, setPodeConcluir] = useState(false)

  const [carregando, setCarregando] = useState<
    'varejistas' | 'importando' | 'validando' | 'consolidando' | 'salvando' | null
  >(null)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  const [itemParaCadastrar, setItemParaCadastrar] = useState<ItemPreview | null>(null)

  const tabelaRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Carregar varejistas ───────────────────────────────────────────────────

  useEffect(() => {
    if (!accessToken) return
    setCarregando('varejistas')
    listarVarejistas(accessToken)
      .then((resp) => setVarejistas(resp.results))
      .catch(() => setErro('Não foi possível carregar a lista de varejistas.'))
      .finally(() => setCarregando(null))
  }, [accessToken])

  // ── Handlers ─────────────────────────────────────────────────────────────

  async function handleImportar() {
    if (!accessToken || !varejistaSelecionado || !arquivo) return
    setCarregando('importando')
    setErro(null)
    setSucesso(false)
    setNota(null)
    setItens([])
    setPodeConcluir(false)

    try {
      const xml = await lerArquivoXML(arquivo)
      const resp = await importarXML(accessToken, {
        xml,
        varejista_id: Number(varejistaSelecionado),
      })
      setNota(resp.nota)
      setItens(resp.itens)
      setPodeConcluir(resp.pode_concluir)
      setTimeout(() => tabelaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150)
    } catch (err) {
      setErro(extrairErro(err))
    } finally {
      setCarregando(null)
    }
  }

  async function handleValidar() {
    if (!accessToken || !varejistaSelecionado || itens.length === 0) return
    setCarregando('validando')
    setErro(null)

    try {
      const resp = await validarItens(accessToken, {
        varejista_id: Number(varejistaSelecionado),
        itens,
      })
      setItens(resp.itens)
      setPodeConcluir(resp.pode_concluir)
    } catch (err) {
      setErro(extrairErro(err))
    } finally {
      setCarregando(null)
    }
  }

  async function handleConsolidar() {
    if (!accessToken || itens.length === 0) return
    setCarregando('consolidando')
    setErro(null)

    try {
      const resp = await consolidar(accessToken, { itens })
      setItens(resp.itens)
    } catch (err) {
      setErro(extrairErro(err))
    } finally {
      setCarregando(null)
    }
  }

  async function handleSalvar() {
    if (!accessToken || !nota || !varejistaSelecionado || !podeConcluir) return
    setCarregando('salvando')
    setErro(null)

    try {
      await salvarNota(accessToken, {
        nota,
        itens,
        varejista_id: Number(varejistaSelecionado),
      })
      setSucesso(true)
      // Reset form
      setNota(null)
      setItens([])
      setPodeConcluir(false)
      setArquivo(null)
      setVarejistaSelecionado('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setErro(extrairErro(err))
    } finally {
      setCarregando(null)
    }
  }

  async function handleCodigoCadastrado() {
    setItemParaCadastrar(null)
    // Re-validate automatically after registering the code
    await handleValidar()
  }

  const temNaosCadastrados = itens.some((i) => i.status === 'NAO_CADASTRADO')
  const ocupado = carregando !== null
  const podeImportar = !!varejistaSelecionado && !!arquivo && !ocupado

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 p-6">

      {/* Cabeçalho */}
      <div>
        <h2 className="text-base font-semibold text-foreground">Entrada de Nota Fiscal</h2>
        <p className="text-sm text-muted-foreground">Importação de NF-e via XML</p>
      </div>

      {/* Sucesso */}
      {sucesso && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          Nota fiscal salva com sucesso!
        </div>
      )}

      {/* Erro global */}
      {erro && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {erro}
        </div>
      )}

      {/* ── Seção 1: Importação ──────────────────────────────────────────── */}
      <section
        aria-label="Importação de XML"
        className="rounded-xl border border-border bg-background p-6 shadow-sm"
      >
        <h3 className="mb-4 text-sm font-semibold text-foreground">Importação</h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {/* Varejista */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Varejista
              <span className="ml-0.5 text-destructive" aria-hidden="true">*</span>
            </label>
            <select
              value={varejistaSelecionado}
              onChange={(e) => setVarejistaSelecionado(Number(e.target.value) || '')}
              disabled={ocupado || carregando === 'varejistas'}
              className={inputSelectClass}
              aria-required="true"
            >
              <option value="">
                {carregando === 'varejistas' ? 'Carregando…' : 'Selecione um varejista…'}
              </option>
              {varejistas.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Arquivo XML */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Arquivo XML
              <span className="ml-0.5 text-destructive" aria-hidden="true">*</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xml,application/xml,text/xml"
              onChange={(e) => {
                setSucesso(false)
                setErro(null)
                setArquivo(e.target.files?.[0] ?? null)
              }}
              disabled={ocupado}
              className={cn(
                'mt-0.5 block w-full text-sm text-foreground cursor-pointer rounded-md border border-input bg-background',
                'file:mr-4 file:py-1.5 file:px-3 file:rounded-l-md file:border-0',
                'file:text-sm file:font-medium file:bg-muted file:text-foreground',
                'hover:file:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-ring',
                'disabled:cursor-not-allowed disabled:opacity-50',
              )}
              aria-required="true"
            />
            {arquivo && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <FileText className="h-3 w-3" aria-hidden="true" />
                {arquivo.name}
                <span className="ml-1 text-muted-foreground/60">
                  ({(arquivo.size / 1024).toFixed(1)} KB)
                </span>
              </p>
            )}
          </div>

          {/* Botão importar */}
          <div className="flex items-end">
            <Button
              onClick={handleImportar}
              disabled={!podeImportar}
              className="w-full sm:w-auto"
            >
              {carregando === 'importando' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                  Importando…
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
                  Importar XML
                </>
              )}
            </Button>
          </div>
        </div>
      </section>

      {/* ── Seção 2: Dados da nota ───────────────────────────────────────── */}
      {nota && (
        <section
          aria-label="Dados da nota fiscal"
          className="rounded-xl border border-border bg-background p-6 shadow-sm"
        >
          <h3 className="mb-4 text-sm font-semibold text-foreground">Dados da Nota</h3>

          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <dt className="text-xs text-muted-foreground uppercase tracking-wide">Número</dt>
              <dd className="mt-0.5 text-sm font-semibold text-foreground tabular-nums">
                {nota.numero}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground uppercase tracking-wide">Série</dt>
              <dd className="mt-0.5 text-sm font-semibold text-foreground tabular-nums">
                {nota.serie}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground uppercase tracking-wide">Data Emissão</dt>
              <dd className="mt-0.5 text-sm font-medium text-foreground">
                {formatarData(nota.data_emissao)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground uppercase tracking-wide">Valor Total</dt>
              <dd className="mt-0.5 text-sm font-semibold text-foreground tabular-nums">
                {formatarMoeda(nota.valor_total)}
              </dd>
            </div>
          </dl>

          {nota.chave_acesso && (
            <div className="mt-4 border-t border-border pt-3">
              <dt className="text-xs text-muted-foreground uppercase tracking-wide">Chave de Acesso</dt>
              <dd className="mt-0.5 font-mono text-xs text-muted-foreground break-all">
                {nota.chave_acesso}
              </dd>
            </div>
          )}
        </section>
      )}

      {/* ── Seção 3: Tabela de itens ─────────────────────────────────────── */}
      {itens.length > 0 && (
        <div ref={tabelaRef}>
          <TabelaItens
            itens={itens}
            onCadastrarCodigo={setItemParaCadastrar}
            disabled={ocupado}
          />
        </div>
      )}

      {/* ── Seção 4: Ações ───────────────────────────────────────────────── */}
      {itens.length > 0 && (
        <section
          aria-label="Ações da nota fiscal"
          className="rounded-xl border border-border bg-background p-4 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">

            {/* Indicador de status */}
            <div className="flex items-center gap-2">
              {podeConcluir ? (
                <span className="flex items-center gap-1.5 text-sm text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Pronto para salvar
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" aria-hidden="true" />
                  {temNaosCadastrados
                    ? 'Cadastre os códigos pendentes antes de salvar'
                    : 'Valide os itens antes de salvar'}
                </span>
              )}
            </div>

            {/* Botões de ação */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={handleValidar}
                disabled={ocupado}
              >
                {carregando === 'validando' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                    Validando…
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                    Validar Itens
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleConsolidar}
                disabled={ocupado || temNaosCadastrados}
                title={temNaosCadastrados ? 'Resolva os itens não cadastrados primeiro' : undefined}
              >
                {carregando === 'consolidando' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                    Consolidando…
                  </>
                ) : (
                  <>
                    <Layers className="h-4 w-4 mr-2" aria-hidden="true" />
                    Consolidar
                  </>
                )}
              </Button>

              <Button
                onClick={handleSalvar}
                disabled={ocupado || !podeConcluir}
                title={!podeConcluir ? 'Valide e consolide os itens antes de salvar' : undefined}
              >
                {carregando === 'salvando' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                    Salvando…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" aria-hidden="true" />
                    Salvar Nota
                  </>
                )}
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ── Modal de cadastro de código ──────────────────────────────────── */}
      {itemParaCadastrar && (
        <ModalCadastroCodigo
          item={itemParaCadastrar}
          varejista_id={Number(varejistaSelecionado)}
          onSalvo={handleCodigoCadastrado}
          onFechar={() => setItemParaCadastrar(null)}
        />
      )}

    </div>
  )
}
