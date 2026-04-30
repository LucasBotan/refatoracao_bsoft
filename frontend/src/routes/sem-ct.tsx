/**
 * sem-ct.tsx — tela de bloqueio para usuários sem Centro de Trabalho.
 *
 * Exibida quando GET /me/ retorna usuario_sem_ct = true.
 * Não permite acesso a nenhuma outra parte do sistema.
 * Usuário deve contatar o responsável para ter o CT atribuído no Django Admin.
 */
import { createFileRoute, Navigate } from '@tanstack/react-router'
import { AlertTriangle, Factory, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useUserCT } from '@/hooks/useUserCT'

export const Route = createFileRoute('/sem-ct')({
  component: SemCtPage,
})

function SemCtPage() {
  const { isAuthenticated, isLoading, logout } = useAuth()
  const { userCT, isLoadingCT } = useUserCT()

  if (isLoading || isLoadingCT) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="text-muted-foreground text-sm">Verificando sessão…</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Usuário tem CT — não deve estar nesta página
  if (userCT && !userCT.usuario_sem_ct) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Branding */}
      <div className="mb-8 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Factory className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
        </div>
        <span className="text-sm font-bold tracking-tight">FábricaOS</span>
      </div>

      {/* Card de bloqueio */}
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        {/* Ícone de aviso */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <AlertTriangle
              className="h-8 w-8 text-amber-600 dark:text-amber-400"
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Título */}
        <h1 className="mb-6 text-center text-xl font-bold text-foreground">
          Acesso Bloqueado
        </h1>

        {/* Mensagens */}
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p className="font-semibold text-foreground">
            ATENÇÃO: Seu usuário não está vinculado a um Centro de Trabalho (CT).
          </p>
          <p>
            Para acessar o sistema, é necessário que seu cadastro esteja associado a um CT.
          </p>
          <p>
            Por favor, entre em contato com seu superior ou com a equipe responsável e solicite
            a vinculação do seu usuário a um Centro de Trabalho.
          </p>
        </div>

        {/* Separador */}
        <div className="my-6 border-t border-border" />

        {/* Botão de logout */}
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sair da conta
        </button>
      </div>
    </div>
  )
}
