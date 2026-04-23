/**
 * /callback — receptor do retorno OAuth2.
 *
 * O backend redireciona o navegador aqui após autenticar o usuário no Azure AD.
 * Os tokens chegam no fragmento de URL (#access_token=...&refresh_token=...).
 *
 * O hash não é enviado ao servidor, mas fica no histórico do browser.
 * O fragmento é lido, os tokens são armazenados via AuthContext e a URL
 * é limpa imediatamente via replaceState para não persistir no histórico.
 *
 * Erros de callback chegam como #error=<code> (redirect do backend).
 */
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Factory } from 'lucide-react'

export const Route = createFileRoute('/callback')({
  component: CallbackPage,
})

const ERROR_MESSAGES: Record<string, string> = {
  provider_error: 'O provedor de identidade recusou o acesso.',
  invalid_state: 'Requisição inválida ou expirada. Tente novamente.',
  missing_code: 'Código de autorização ausente.',
  token_acquisition_failed: 'Falha ao obter credenciais. Tente novamente.',
  graph_api_error: 'Não foi possível recuperar dados do usuário.',
}

function parseHash(hash: string): Record<string, string> {
  return Object.fromEntries(new URLSearchParams(hash.replace(/^#/, '')))
}

function CallbackPage() {
  const navigate = useNavigate()
  const { setTokens } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const processed = useRef(false)

  useEffect(() => {
    // Evita duplo processamento em StrictMode
    if (processed.current) return
    processed.current = true

    const params = parseHash(window.location.hash)

    // Limpa o hash imediatamente — tokens não devem persistir na URL
    window.history.replaceState(null, '', window.location.pathname)

    if (params['error']) {
      const message = ERROR_MESSAGES[params['error']] ?? 'Erro de autenticação.'
      setError(message)
      return
    }

    const accessToken = params['access_token']
    const refreshToken = params['refresh_token']

    if (!accessToken || !refreshToken) {
      setError('Resposta de autenticação incompleta.')
      return
    }

    setTokens({ access_token: accessToken, refresh_token: refreshToken })
      .then(() => navigate({ to: '/', replace: true }))
      .catch(() => setError('Não foi possível iniciar a sessão. Tente novamente.'))
  }, [navigate, setTokens])

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
          <Factory className="size-5 text-destructive" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">Falha na autenticação</h2>
          <p className="max-w-xs text-sm text-muted-foreground">{error}</p>
        </div>
        <a href="/login" className="text-sm font-medium text-primary hover:underline">
          Voltar para o login
        </a>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Factory className="size-5" />
      </div>
      <p className="text-sm text-muted-foreground">Autenticando…</p>
    </div>
  )
}
