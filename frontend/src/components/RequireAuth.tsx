/**
 * RequireAuth — guarda de rota que redireciona para /login quando o
 * usuário não está autenticado.
 *
 * Exibe um loader enquanto o bootstrap de sessão está em andamento para
 * evitar flash de redirect em usuários com sessão válida (refresh token).
 */
import { Navigate } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'

interface RequireAuthProps {
  children: React.ReactNode
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="text-muted-foreground text-sm">Verificando sessão…</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
