/**
 * AppSidebar — navegação principal do FábricaOS.
 *
 * Seções são accordion: apenas uma aberta por vez. A seção que contém
 * a rota atual abre automaticamente no carregamento. Clicar numa seção
 * aberta a fecha; clicar numa fechada a abre e fecha as demais.
 *
 * Layout:
 *   ┌─────────────────┐
 *   │  Branding       │  h-16, borda inferior
 *   ├─────────────────┤
 *   │  Nav OPERAÇÃO   │  flex-1 com scroll, accordion
 *   │  Nav GESTÃO     │
 *   │  Nav CADASTRO   │
 *   ├─────────────────┤
 *   │  Usuário + sair │  rodapé fixo
 *   └─────────────────┘
 */
import { useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { Factory, LogOut, ChevronDown, MapPin } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { useUserCT } from '@/hooks/useUserCT'
import { OPERACAO_ITEMS, GESTAO_ITEMS, RECEBIMENTO_ITEMS, CADASTRO_ITEMS, type MenuItem } from '@/config/menuConfig'
import { cn } from '@/lib/utils'

// ── Tipos ────────────────────────────────────────────────────────────────────

type SectionId = 'operacao' | 'gestao' | 'recebimento' | 'cadastro'

// ── Helper ───────────────────────────────────────────────────────────────────

function detectActiveSection(pathname: string): SectionId {
  if (CADASTRO_ITEMS.some((i) => pathname === i.path || pathname.startsWith(i.path + '/')))
    return 'cadastro'
  if (RECEBIMENTO_ITEMS.some((i) => pathname === i.path || pathname.startsWith(i.path + '/')))
    return 'recebimento'
  if (GESTAO_ITEMS.some((i) => pathname === i.path || pathname.startsWith(i.path + '/')))
    return 'gestao'
  return 'operacao'
}

// ── Sub-componente de seção accordion ────────────────────────────────────────

interface NavSectionProps {
  title: string
  items: MenuItem[]
  pathname: string
  isOpen: boolean
  onToggle: () => void
}

function NavSection({ title, items, pathname, isOpen, onToggle }: NavSectionProps) {
  if (items.length === 0) return null

  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between rounded-md px-3 py-2 transition-colors hover:bg-sidebar-accent/40"
      >
        <span className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
          {title}
        </span>
        <ChevronDown
          className={cn(
            'h-3 w-3 shrink-0 text-sidebar-foreground/40 transition-transform duration-200',
            isOpen && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </button>

      {/* Animação via grid: grid-rows-[0fr] → grid-rows-[1fr] não precisa de height JS */}
      <div
        className={cn(
          'grid transition-all duration-200 ease-in-out',
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <nav className="overflow-hidden" aria-label={title}>
          <div className="pb-1">
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
          </div>
        </nav>
      </div>
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────

export function AppSidebar() {
  const { user, logout } = useAuth()
  const { can } = usePermissions()
  const { userCT } = useUserCT()
  const location = useLocation()
  const pathname = location.pathname

  // Abre automaticamente a seção que contém a rota atual
  const [openSection, setOpenSection] = useState<SectionId | null>(
    () => detectActiveSection(pathname),
  )

  function handleToggle(section: SectionId) {
    setOpenSection((prev) => (prev === section ? null : section))
  }

  const visibleOperacao = OPERACAO_ITEMS.filter((i) => can(i.capability))
  const visibleGestao = GESTAO_ITEMS.filter((i) => can(i.capability))
  const visibleRecebimento = RECEBIMENTO_ITEMS.filter((i) => can(i.capability))
  const visibleCadastro = CADASTRO_ITEMS.filter((i) => can(i.capability))

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
        <NavSection
          title="Operação"
          items={visibleOperacao}
          pathname={pathname}
          isOpen={openSection === 'operacao'}
          onToggle={() => handleToggle('operacao')}
        />
        <NavSection
          title="Gestão"
          items={visibleGestao}
          pathname={pathname}
          isOpen={openSection === 'gestao'}
          onToggle={() => handleToggle('gestao')}
        />
        <NavSection
          title="Recebimento"
          items={visibleRecebimento}
          pathname={pathname}
          isOpen={openSection === 'recebimento'}
          onToggle={() => handleToggle('recebimento')}
        />
        <NavSection
          title="Cadastro"
          items={visibleCadastro}
          pathname={pathname}
          isOpen={openSection === 'cadastro'}
          onToggle={() => handleToggle('cadastro')}
        />
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

        {/* Indicador de Centro de Trabalho */}
        {userCT?.ct && (
          <div className="mt-2 flex items-center gap-1.5 rounded-md bg-sidebar-accent/40 px-2 py-1.5">
            <MapPin className="h-3 w-3 shrink-0 text-sidebar-foreground/50" aria-hidden="true" />
            <p className="truncate text-[10px] leading-none text-sidebar-foreground/70">
              <span className="font-semibold">{userCT.nome_centro_trabalho}</span>
              <span className="mx-1 text-sidebar-foreground/40">·</span>
              <span>CT: {userCT.ct}</span>
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}
