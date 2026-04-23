/**
 * _app.tsx — layout autenticado (rota pathless).
 *
 * Envolve todas as rotas protegidas com:
 *   - RequireAuth: redireciona para /login se não autenticado
 *   - AppSidebar: navegação lateral
 *   - AppTopbar: barra superior com título dinâmico
 *
 * O prefixo `_` torna a rota pathless: não adiciona segmento à URL.
 * Rotas filho ficam em routes/_app/ e herdam este layout.
 */
import { createFileRoute, Outlet, useLocation } from '@tanstack/react-router'
import { RequireAuth } from '@/components/RequireAuth'
import { AppSidebar } from '@/components/AppSidebar'
import { AppTopbar } from '@/components/AppTopbar'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/ordens': 'Ordens de Produção',
  '/apontamentos': 'Apontamentos',
  '/maquinas': 'Máquinas e Equipamentos',
  '/qualidade': 'Qualidade',
  '/estoque': 'Estoque',
  '/manutencao': 'Manutenção',
  '/relatorios': 'Relatórios',
  '/usuarios': 'Usuários',
  '/configuracoes': 'Configurações',
}

function AppLayout() {
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] ?? 'FábricaOS'

  return (
    <RequireAuth>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppTopbar title={title} />
          <main className="flex-1 overflow-y-auto" id="main-content">
            <Outlet />
          </main>
        </div>
      </div>
    </RequireAuth>
  )
}
