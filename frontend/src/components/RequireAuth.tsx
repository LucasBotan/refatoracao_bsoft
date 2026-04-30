/**
 * RequireAuth — guarda de rota que valida autenticação e Centro de Trabalho.
 *
 * Ordem de verificação:
 *   1. Aguarda bootstrap da sessão (AuthContext)
 *   2. Redireciona para /login se não autenticado
 *   3. Aguarda resolução do CT via GET /me/ (UserContext)
 *   4. Redireciona para /sem-ct se usuario_sem_ct === true
 *   5. Renderiza conteúdo protegido
 *
 * O CT é sempre validado via backend — nunca confiando em dados locais.
 */
import { Navigate } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'
import { useUserCT } from '@/hooks/useUserCT'

interface RequireAuthProps {
  children: React.ReactNode
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const { userCT, isLoadingCT } = useUserCT()

  // Sessão ainda bootstrapping ou CT ainda sendo resolvido
  if (isLoading || isLoadingCT || (isAuthenticated && userCT === null)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="text-muted-foreground text-sm">Verificando sessão…</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (userCT?.usuario_sem_ct) {
    return <Navigate to="/sem-ct" replace />
  }

  return <>{children}</>
}
