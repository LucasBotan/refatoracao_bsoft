import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ChevronRight, Store } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useUserCT } from '@/hooks/useUserCT'
import { VarejistasForm, type FormErrors } from '@/components/varejistas/VarejistasForm'
import {
  criarVarejista,
  type CriarVarejistaPayload,
  type ApiValidationErrors,
} from '@/services/varejistasService'

export const Route = createFileRoute('/_app/varejistas/novo')({
  component: NovoVarejistaPage,
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

function NovoVarejistaPage() {
  const { accessToken } = useAuth()
  const { userCT } = useUserCT()
  const navigate = useNavigate()

  const [erros, setErros] = useState<FormErrors>({})
  const [carregando, setCarregando] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  async function handleSubmit(payload: CriarVarejistaPayload) {
    if (!accessToken) return
    setCarregando(true)
    setErros({})
    setSucesso(false)

    try {
      await criarVarejista(accessToken, payload)
      setSucesso(true)
      setTimeout(() => navigate({ to: '/varejistas' }), 1200)
    } catch (err) {
      if (err && typeof err === 'object' && !('message' in err)) {
        setErros(normalizarErros(err as ApiValidationErrors))
      } else {
        setErros({ _form: err instanceof Error ? err.message : 'Erro ao salvar. Tente novamente.' })
      }
    } finally {
      setCarregando(false)
    }
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
        <span>Novo cadastro</span>
      </nav>

      {/* ── Feedback global ────────────────────────────────────────── */}
      {sucesso && (
        <div
          role="status"
          className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          Varejista cadastrado com sucesso. Redirecionando…
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
        ct={userCT?.ct ?? ''}
        errors={erros}
        isLoading={carregando}
        submitLabel={carregando ? 'Salvando…' : 'Salvar varejista'}
        onSubmit={handleSubmit}
        onCancel={() => navigate({ to: '/varejistas' })}
      />
    </div>
  )
}
