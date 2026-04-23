import { createFileRoute, Navigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Factory, Activity, ShieldCheck, Cog, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { getLoginUrl } from '@/services/authService'

export const Route = createFileRoute('/login')({
  head: () => ({
    meta: [
      { title: 'Entrar — FábricaOS' },
      { name: 'description', content: 'Acesso ao sistema de gestão de chão de fábrica FábricaOS.' },
    ],
  }),
  component: LoginPage,
})

const ERROR_MESSAGES: Record<string, string> = {
  provider_error: 'O provedor de identidade recusou o acesso. Contate o TI.',
  invalid_state: 'A sessão de login expirou. Por favor, tente novamente.',
  missing_code: 'Resposta inválida do provedor. Contate o TI.',
  token_acquisition_failed: 'Não foi possível obter credenciais. Tente novamente.',
  graph_api_error: 'Erro ao recuperar dados do usuário. Contate o TI.',
}

function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const [redirecting, setRedirecting] = useState(false)
  const [callbackError, setCallbackError] = useState<string | null>(null)

  // Lê erro vindo de redirect do backend (ex: callback com erro)
  useEffect(() => {
    const hash = window.location.hash
    if (hash.startsWith('#error=')) {
      const code = hash.replace('#error=', '')
      setCallbackError(ERROR_MESSAGES[code] ?? 'Erro de autenticação.')
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/" replace />
  }

  function handleSSOLogin() {
    setRedirecting(true)
    // Navega para o backend que inicia o fluxo OAuth2 com Azure AD
    window.location.href = getLoginUrl()
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-background">
      {/* ── Painel esquerdo institucional ──────────────────────── */}
      <div className="relative hidden lg:flex flex-col justify-between bg-sidebar text-sidebar-foreground p-10 overflow-hidden">
        {/* Gradiente decorativo industrial */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, var(--sidebar-primary) 0, transparent 50%), radial-gradient(circle at 80% 80%, var(--primary-glow) 0, transparent 45%)',
          }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Factory className="size-5" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-semibold">FábricaOS</span>
            <span className="text-[11px] uppercase tracking-widest text-sidebar-foreground/60">
              MES Enterprise Suite
            </span>
          </div>
        </div>

        {/* Headline + descrição + cards */}
        <div className="relative space-y-6">
          <h2 className="text-3xl font-bold leading-tight">
            Sistema de Gestão de
            <br />
            Chão de Fábrica
          </h2>
          <p className="max-w-md text-sm text-sidebar-foreground/70">
            Monitore produção, qualidade e manutenção em tempo real. Tomada de
            decisão baseada em dados para uma operação enxuta e confiável.
          </p>
          <div className="grid grid-cols-3 gap-3 max-w-md">
            {[
              { icon: Activity, label: 'Tempo real' },
              { icon: ShieldCheck, label: 'Qualidade' },
              { icon: Cog, label: 'OEE & MES' },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-start gap-2 rounded-md border border-sidebar-border bg-sidebar-accent/40 p-3"
              >
                <Icon className="size-4 text-sidebar-primary" />
                <span className="text-xs text-sidebar-foreground/80">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-[11px] text-sidebar-foreground/50">
          v1.0.0 · © {new Date().getFullYear()} FábricaOS Industrial Systems
        </div>
      </div>

      {/* ── Painel direito — autenticação ──────────────────────── */}
      <div className="flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-sm space-y-8">

          {/* Logo mobile */}
          <div className="space-y-2 text-center lg:text-left">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
              <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Factory className="size-4" />
              </div>
              <span className="text-base font-semibold">FábricaOS</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Acessar sistema
            </h1>
            <p className="text-sm text-muted-foreground">
              Use sua conta corporativa para acessar o ambiente de operação.
            </p>
          </div>

          {/* Bloco de erro vindo do callback */}
          {callbackError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3">
              <p className="text-sm text-destructive">{callbackError}</p>
            </div>
          )}

          {/* CTA principal — SSO */}
          <div className="space-y-4">
            <div className="rounded-md border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              O acesso é realizado via conta corporativa Microsoft. Nenhuma
              senha adicional é necessária.
            </div>

            <Button
              onClick={handleSSOLogin}
              disabled={redirecting || isLoading}
              className="w-full"
              size="lg"
            >
              {redirecting ? (
                <>Redirecionando…</>
              ) : (
                <>
                  <Building2 className="size-4" />
                  Entrar com conta corporativa
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Problemas para acessar?{' '}
              <a
                href="mailto:ti@fabrica.com"
                className="font-medium text-primary hover:underline"
              >
                Contate o TI
              </a>
            </p>
          </div>

          <div className="lg:hidden text-center text-[11px] text-muted-foreground">
            v1.0.0 · © {new Date().getFullYear()} FábricaOS
          </div>
        </div>
      </div>
    </div>
  )
}
