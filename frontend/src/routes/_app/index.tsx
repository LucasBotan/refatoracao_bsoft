/**
 * Dashboard Home — página principal do FábricaOS (rota /).
 *
 * Dados reais: nome e grupos do usuário vêm do AuthContext (via /auth/profile/).
 * Turno calculado localmente pelo horário do browser.
 *
 * Pressupostos documentados (a serem integrados com backend):
 *   - Unidade e Linha: sem endpoint; exibe "—" até integração.
 *   - Status SCADA/MES/ERP: placeholders visuais; não representam estado real.
 *   - Turno: horário local do browser, não do servidor.
 *   - Atalhos: derivados de MENU_ITEMS filtrados pelas capabilities do usuário.
 */
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
  Clock,
  Factory,
  MapPin,
  Activity,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { MENU_ITEMS } from '@/config/menuConfig'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_app/')({
  component: DashboardHome,
})

// ── Utilitários de turno ─────────────────────────────────────────────────────

interface ShiftInfo {
  label: string
  hours: string
  number: 1 | 2 | 3
  colorClass: string
}

function getCurrentShift(): ShiftInfo {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 14)
    return { label: 'Turno 1', hours: '06h – 14h', number: 1, colorClass: 'text-emerald-600' }
  if (hour >= 14 && hour < 22)
    return { label: 'Turno 2', hours: '14h – 22h', number: 2, colorClass: 'text-amber-600' }
  return { label: 'Turno 3', hours: '22h – 06h', number: 3, colorClass: 'text-blue-600' }
}

function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// ── Dados placeholder de integração ─────────────────────────────────────────
// Sem endpoint de status no backend; exibido com indicação visual de placeholder.
const INTEGRATION_STATUS = [
  { label: 'SCADA', key: 'scada' },
  { label: 'MES', key: 'mes' },
  { label: 'ERP', key: 'erp' },
] as const

// ── Componente principal ─────────────────────────────────────────────────────

export function DashboardHome() {
  const { user } = useAuth()
  const { can } = usePermissions()
  const now = useNow()
  const shift = getCurrentShift()

  const displayName = user?.first_name
    ? `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`.trim()
    : user?.email?.split('@')[0] ?? 'Operador'

  // Atalhos: todos os módulos visíveis exceto a própria home, limitado a 6
  const shortcuts = MENU_ITEMS.filter(
    (item) => can(item.capability) && item.path !== '/',
  ).slice(0, 6)

  return (
    <div className="space-y-5 p-6">

      {/* ── Banner de boas-vindas ─────────────────────────────────────── */}
      <section
        aria-label="Informações do usuário e turno"
        className="rounded-xl border border-border bg-background p-6 shadow-sm"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          {/* Saudação e contexto */}
          <div>
            <p className="text-sm text-muted-foreground">Bem-vindo de volta</p>
            <h2 className="mt-0.5 text-2xl font-bold text-foreground">{displayName}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>
                  {formatTime(now)} · <span className="capitalize">{formatDate(now)}</span>
                </span>
              </span>
              <span className={cn('flex items-center gap-1.5 font-medium', shift.colorClass)}>
                <Factory className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {shift.label} · {shift.hours}
              </span>
              {/* Unidade e linha — placeholder sem dado de backend */}
              <span
                className="flex items-center gap-1.5 text-muted-foreground/50 italic"
                title="Unidade e linha — aguarda integração com backend"
              >
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Unidade / Linha —
              </span>
            </div>
          </div>

          {/* Card de turno */}
          <div
            aria-label={`Turno atual: ${shift.label}, ${shift.hours}`}
            className="shrink-0 rounded-lg border border-border bg-muted px-5 py-3 text-center"
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Turno
            </p>
            <p className={cn('mt-0.5 text-4xl font-bold', shift.colorClass)}>
              {shift.number}
            </p>
            <p className="text-xs text-muted-foreground">{shift.hours}</p>
          </div>
        </div>
      </section>

      {/* ── Status operacional — placeholder ─────────────────────────── */}
      <section
        aria-label="Status operacional da planta"
        className="rounded-xl border border-border bg-background p-5 shadow-sm"
      >
        <div className="mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-foreground">Status Operacional</h3>
          <span
            className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground/50 italic"
            title="Integração com SCADA/MES/ERP não disponível — dados ficticios"
          >
            <AlertCircle className="h-3 w-3" aria-hidden="true" />
            placeholder — sem integração
          </span>
        </div>
        <div className="flex flex-wrap gap-2" role="list" aria-label="Chips de integração">
          {INTEGRATION_STATUS.map((sys) => (
            <span
              key={sys.key}
              role="listitem"
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border border-border',
                'bg-muted px-3 py-1 text-xs font-medium text-muted-foreground',
              )}
              title={`Status ${sys.label}: endpoint não disponível`}
            >
              <CheckCircle2
                className="h-3 w-3 text-muted-foreground/40"
                aria-hidden="true"
              />
              {sys.label}
            </span>
          ))}
        </div>
      </section>

      {/* ── Atalhos rápidos ──────────────────────────────────────────── */}
      {shortcuts.length > 0 && (
        <section aria-label="Atalhos rápidos">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Atalhos rápidos</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {shortcuts.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex flex-col items-center gap-2.5 rounded-xl border border-border',
                    'bg-background p-4 text-center shadow-sm',
                    'transition-colors hover:border-primary/30 hover:bg-primary/5',
                    'focus:outline-none focus:ring-2 focus:ring-ring',
                  )}
                  aria-label={`Ir para ${item.label}: ${item.description}`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-medium leading-tight text-foreground">
                      {item.label}
                    </p>
                    <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
