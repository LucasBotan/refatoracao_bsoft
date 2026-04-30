import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { ChevronRight, Store, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useUserCT } from '@/hooks/useUserCT'
import { VarejistasForm, type FormErrors } from '@/components/varejistas/VarejistasForm'
import {
  buscarVarejista,
  atualizarVarejista,
  type Varejista,
  type CriarVarejistaPayload,
  type ApiValidationErrors,
} from '@/services/varejistasService'

export const Route = createFileRoute('/_app/varejistas/$id')({
  component: EditarVarejistaPage,
})

function normalizarErros(raw: ApiValidationErrors): FormErrors {
  const erros: FormErrors = {}
  for (const [campo, msgs] of Object.entries(raw)) {
    const msg = Array.isArray(msgs) ? msgs[0] : String(msgs)
    if (campo === 'ct') {
      erros._form = msg
    } else {
      erros[campo as keyof FormErrors] = msg
    }
  }
  return erros
}

function EditarVarejistaPage() {
  const { id } = Route.useParams()
  const { accessToken } = useAuth()
  const { userCT } = useUserCT()
  const navigate = useNavigate()
  const idNum = parseInt(id, 10)

  const [varejista, setVarejista] = useState<Varejista | null>(null)
  const [carregandoDados, setCarregandoDados] = useState(true)
  const [erroDados, setErroDados] = useState<string | null>(null)
  const [erros, setErros] = useState<FormErrors>({})
  const [carregando, setCarregando] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  useEffect(() => {
    if (!accessToken || isNaN(idNum)) return

    setCarregandoDados(true)
    setErroDados(null)

    buscarVarejista(accessToken, idNum)
      .then(setVarejista)
      .catch((err) =>
        setErroDados(err instanceof Error ? err.message : 'Erro ao carregar varejista.'),
      )
      .finally(() => setCarregandoDados(false))
  }, [accessToken, idNum])

  async function handleSubmit(payload: CriarVarejistaPayload) {
    if (!accessToken) return
    setCarregando(true)
    setErros({})
    setSucesso(false)

    try {
      await atualizarVarejista(accessToken, idNum, payload)
      setSucesso(true)
      setTimeout(() => navigate({ to: '/varejistas' }), 1200)
    } catch (err) {
      if (err && typeof err === 'object' && !('message' in err)) {
        setErros(normalizarErros(err as ApiValidationErrors))
      } else {
        setErros({ _form: err instanceof Error ? err.message : 'Erro ao atualizar. Tente novamente.' })
      }
    } finally {
      setCarregando(false)
    }
  }

  if (carregandoDados) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Carregando" />
      </div>
    )
  }

  if (erroDados || !varejista) {
    return (
      <div className="p-6">
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {erroDados ?? 'Varejista não encontrado.'}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 p-6">

      {/* ── Breadcrumb ─────────────────────────────────────────────── */}
      <nav aria-label="Navegação" className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Store className="h-4 w-4 shrink-0" aria-hidden="true" />
        <button
          onClick={() => navigate({ to: '/varejistas' })}
          className="font-medium text-foreground hover:underline"
        >
          Varejistas
        </button>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Editar — {varejista.nome}</span>
      </nav>

      {/* ── Feedback global ────────────────────────────────────────── */}
      {sucesso && (
        <div
          role="status"
          className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          Varejista atualizado com sucesso. Redirecionando…
        </div>
      )}

      {erros._form && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {erros._form}
        </div>
      )}

      <VarejistasForm
        initialValues={varejista}
        ct={userCT?.ct ?? ''}
        errors={erros}
        isLoading={carregando}
        submitLabel={carregando ? 'Salvando…' : 'Atualizar varejista'}
        onSubmit={handleSubmit}
        onCancel={() => navigate({ to: '/varejistas' })}
      />
    </div>
  )
}
