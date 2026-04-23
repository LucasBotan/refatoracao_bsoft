/**
 * AppTopbar — barra superior da aplicação autenticada.
 *
 * Contém:
 *   - Título da página atual (recebido via prop)
 *   - Busca visual: filtra MENU_ITEMS visíveis ao usuário (sem backend)
 *   - Indicador de turno calculado pela hora local do browser
 *   - Sino de notificações (placeholder visual — sem endpoint ainda)
 *
 * Pressupostos documentados:
 *   - Turno: calculado localmente; sem endpoint de turno no backend.
 *   - Notificações: badge placeholder; sem endpoint de notificações.
 *   - Busca: filtra apenas menus — sem busca global de registros.
 */
import { useState, useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { Bell, Search, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MENU_ITEMS } from '@/config/menuConfig'
import { usePermissions } from '@/hooks/usePermissions'

export interface AppTopbarProps {
  title: string
}

interface Shift {
  label: string
  colorClass: string
}

function getCurrentShift(): Shift {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 14) return { label: 'Turno 1 · 06h–14h', colorClass: 'text-emerald-500' }
  if (hour >= 14 && hour < 22) return { label: 'Turno 2 · 14h–22h', colorClass: 'text-amber-500' }
  return { label: 'Turno 3 · 22h–06h', colorClass: 'text-blue-500' }
}

export function AppTopbar({ title }: AppTopbarProps) {
  const [query, setQuery] = useState('')
  const { can } = usePermissions()
  const shift = getCurrentShift()

  const searchResults = useMemo(() => {
    const trimmed = query.trim()
    if (!trimmed) return []
    const q = trimmed.toLowerCase()
    return MENU_ITEMS.filter(
      (item) => can(item.capability) && item.label.toLowerCase().includes(q),
    ).slice(0, 5)
  }, [query, can])

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-background px-4">
      {/* Título da página */}
      <h1 className="shrink-0 text-base font-semibold text-foreground">{title}</h1>

      {/* Campo de busca — filtra menus visíveis */}
      <div className="relative mx-auto w-full max-w-xs">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          placeholder="Buscar módulo…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onBlur={() => setTimeout(() => setQuery(''), 150)}
          aria-label="Buscar módulo"
          className={cn(
            'h-8 w-full rounded-md border border-input bg-muted pl-9 pr-3 text-sm',
            'text-foreground placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring',
          )}
        />
        {searchResults.length > 0 && (
          <ul
            role="listbox"
            aria-label="Resultados da busca"
            className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-md border border-border bg-background shadow-lg"
          >
            {searchResults.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.path} role="option">
                  <Link
                    to={item.path}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Indicador de turno — calculado localmente */}
      <div
        className="hidden shrink-0 items-center gap-1.5 sm:flex"
        title="Turno calculado pelo horário local do browser"
      >
        <Clock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
        <span className={cn('text-xs font-medium', shift.colorClass)}>{shift.label}</span>
      </div>

      {/* Notificações — placeholder visual */}
      <button
        aria-label="Notificações (em breve)"
        title="Notificações — endpoint não disponível"
        className="relative shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        {/* Badge placeholder — sem dado real */}
        <span
          aria-hidden="true"
          className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-destructive opacity-60"
        />
      </button>
    </header>
  )
}
