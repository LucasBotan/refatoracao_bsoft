/**
 * Testes da Dashboard Home (_app/index.tsx).
 *
 * Cobertos:
 *   - Saudação "Bem-vindo de volta"
 *   - Nome do usuário autenticado na saudação
 *   - Fallback de nome para email quando first_name ausente
 *   - Label de turno renderizado
 *   - Seção de atalhos rápidos exibida para capabilities disponíveis
 *   - Atalhos filtrados: itens sem capability não aparecem
 *   - Dashboard home não exibe link para si mesma nos atalhos
 *   - Status operacional — chips de integração presentes com indicação de placeholder
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/hooks/useAuth', () => ({ useAuth: vi.fn() }))
vi.mock('@/hooks/usePermissions', () => ({ usePermissions: vi.fn() }))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    createFileRoute: () => (config: { component: React.FC }) => config,
    Link: ({ to, children, className, ...rest }: any) => (
      <a href={to} className={className} {...rest}>
        {children}
      </a>
    ),
  }
})

import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { DashboardHome } from '../_app/index'

// ── Helpers ──────────────────────────────────────────────────────────────────

function setupUser(overrides: {
  firstName?: string
  lastName?: string
  email?: string
  groups?: string[]
} = {}) {
  ;(useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
    user: {
      first_name: overrides.firstName ?? 'Maria',
      last_name: overrides.lastName ?? 'Costa',
      email: overrides.email ?? 'maria@fab.com',
      microsoft_groups: overrides.groups ?? [],
    },
  })
}

function setupPermissions(caps: string[]) {
  ;(usePermissions as ReturnType<typeof vi.fn>).mockReturnValue({
    can: (cap: string) => caps.includes(cap),
  })
}

const OPERADOR_CAPS = [
  'view_dashboard',
  'view_ordens',
  'view_apontamentos',
  'view_maquinas',
  'view_qualidade',
]

const ADMIN_CAPS = [
  ...OPERADOR_CAPS,
  'view_estoque',
  'view_manutencao',
  'view_relatorios',
  'view_usuarios',
  'view_configuracoes',
]

// ── Testes ────────────────────────────────────────────────────────────────────

describe('DashboardHome', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    setupUser()
    setupPermissions(OPERADOR_CAPS)
  })

  describe('saudação e identidade', () => {
    it('exibe "Bem-vindo de volta"', () => {
      render(<DashboardHome />)
      expect(screen.getByText(/Bem-vindo de volta/i)).toBeDefined()
    })

    it('exibe nome completo do usuário', () => {
      render(<DashboardHome />)
      expect(screen.getByText('Maria Costa')).toBeDefined()
    })

    it('usa first_name sem last_name quando last_name é vazio', () => {
      setupUser({ firstName: 'Carlos', lastName: '' })
      render(<DashboardHome />)
      expect(screen.getByText('Carlos')).toBeDefined()
    })

    it('usa parte do email como displayName quando first_name ausente', () => {
      setupUser({ firstName: '', email: 'operador@fab.com' })
      render(<DashboardHome />)
      expect(screen.getByText('operador')).toBeDefined()
    })
  })

  describe('informações de turno', () => {
    it('exibe label de turno (Turno 1, 2 ou 3)', () => {
      render(<DashboardHome />)
      // Turno aparece tanto no banner quanto no card
      const turnoEls = screen.getAllByText(/Turno \d/i)
      expect(turnoEls.length).toBeGreaterThanOrEqual(1)
    })

    it('exibe horários do turno no card', () => {
      render(<DashboardHome />)
      // O card exibe o intervalo de horas do turno (ex: "06h – 14h")
      expect(screen.getAllByText(/\d+h\s*[–-]\s*\d+h/i).length).toBeGreaterThan(0)
    })
  })

  describe('atalhos rápidos — visibilidade por capability', () => {
    it('exibe seção "Atalhos rápidos" quando há shortcuts disponíveis', () => {
      render(<DashboardHome />)
      expect(screen.getByText(/Atalhos rápidos/i)).toBeDefined()
    })

    it('exibe itens de operação nos atalhos', () => {
      render(<DashboardHome />)
      expect(screen.getByText('Ordens de Produção')).toBeDefined()
      expect(screen.getByText('Apontamentos')).toBeDefined()
    })

    it('não inclui Dashboard nos atalhos (rota atual)', () => {
      render(<DashboardHome />)
      // "Dashboard" não deve aparecer nos atalhos (path '/' é excluído)
      expect(screen.queryByRole('link', { name: /Ir para Dashboard/i })).toBeNull()
    })

    it('não exibe módulos sem capability nos atalhos', () => {
      render(<DashboardHome />)
      // Operador sem gestão não vê Usuários
      expect(screen.queryByText('Usuários')).toBeNull()
      expect(screen.queryByText('Configurações')).toBeNull()
    })

    it('exibe itens de gestão para ADMIN', () => {
      setupPermissions(ADMIN_CAPS)
      render(<DashboardHome />)
      // ADMIN vê Relatórios e outros módulos de gestão (limitado a 6 atalhos)
      const shortcuts = screen.getAllByRole('link')
      expect(shortcuts.length).toBeGreaterThan(4)
    })

    it('não exibe seção atalhos quando nenhum módulo está disponível', () => {
      // Usuário que pode apenas ver o dashboard — sem outros módulos
      setupPermissions(['view_dashboard'])
      render(<DashboardHome />)
      expect(screen.queryByText(/Atalhos rápidos/i)).toBeNull()
    })
  })

  describe('status operacional', () => {
    it('exibe chips de integração SCADA, MES e ERP', () => {
      render(<DashboardHome />)
      expect(screen.getByText('SCADA')).toBeDefined()
      expect(screen.getByText('MES')).toBeDefined()
      expect(screen.getByText('ERP')).toBeDefined()
    })

    it('indica visualmente que os chips são placeholders', () => {
      render(<DashboardHome />)
      expect(screen.getByText(/placeholder/i)).toBeDefined()
    })
  })
})
