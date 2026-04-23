/**
 * AppSidebar — navegação principal do FábricaOS.
 *
 * Itens gerados a partir de MENU_ITEMS (config/menuConfig.ts) filtrados
 * pelas capabilities do usuário (hooks/usePermissions.ts). Nenhuma lógica
 * de grupo ou string de permissão reside aqui.
 *
 * Layout:
 *   ┌─────────────────┐
 *   │  Branding       │  h-16, borda inferior
 *   ├─────────────────┤
 *   │  Nav OPERAÇÃO   │  flex-1 com scroll
 *   │  Nav GESTÃO     │
 *   ├─────────────────┤
 *   │  Usuário + sair │  rodapé fixo
 *   └─────────────────┘
 */
import { Link, useLocation } from '@tanstack/react-router'
import { Factory, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { OPERACAO_ITEMS, GESTAO_ITEMS, type MenuItem } from '@/config/menuConfig'
import { cn } from '@/lib/utils'

// ── Sub-componente de seção de navegação ────────────────────────────────────

interface NavSectionProps {
  title: string
  items: MenuItem[]
  pathname: string
}

function NavSection({ title, items, pathname }: NavSectionProps) {
  if (items.length === 0) return null

  return (
    <div className="mb-4">
      <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
        {title}
      </p>
      <nav aria-label={title}>
        {items.map((item) => {
          const isActive =
            item.path === '/'
              ? pathname === '/'
              : pathname === item.path || pathname.startsWith(item.path + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────

export function AppSidebar() {
  const { user, logout } = useAuth()
  const { can } = usePermissions()
  const location = useLocation()
  const pathname = location.pathname

  const visibleOperacao = OPERACAO_ITEMS.filter((i) => can(i.capability))
  const visibleGestao = GESTAO_ITEMS.filter((i) => can(i.capability))

  const displayName = user
    ? (user.first_name
        ? `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`.trim()
        : user.email)
    : '—'

  const initial = (user?.first_name?.[0] ?? user?.email?.[0] ?? '?').toUpperCase()

  return (
    <aside
      className="flex h-screen w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground"
      aria-label="Navegação principal"
    >
      {/* ── Branding ──────────────────────────────────────────────────── */}
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
          <Factory className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold leading-none tracking-tight">FábricaOS</p>
          <p className="mt-0.5 text-[10px] leading-none text-sidebar-foreground/50">
            MES Industrial
          </p>
        </div>
      </div>

      {/* ── Itens de navegação ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto py-4 px-2">
        <NavSection title="Operação" items={visibleOperacao} pathname={pathname} />
        <NavSection title="Gestão" items={visibleGestao} pathname={pathname} />
      </div>

      {/* ── Rodapé do usuário ─────────────────────────────────────────── */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[11px] font-bold text-primary"
            aria-hidden="true"
          >
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium leading-tight">{displayName}</p>
            {user?.email && (
              <p className="truncate text-[10px] leading-tight text-sidebar-foreground/50">
                {user.email}
              </p>
            )}
          </div>
          <button
            onClick={logout}
            aria-label="Sair da sessão"
            className="shrink-0 rounded p-1 text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  )
}
