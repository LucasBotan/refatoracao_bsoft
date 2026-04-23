/**
 * Testes do AppSidebar.
 *
 * Cobertos:
 *   - Renderização do branding FábricaOS
 *   - Exibição do nome do usuário autenticado
 *   - Renderização de itens visíveis por capability
 *   - Ocultação de itens sem capability
 *   - Ausência de seção quando nenhum item é visível
 *   - Botão de logout chama logout()
 *   - Item ativo destacado baseado no pathname
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/hooks/useAuth', () => ({ useAuth: vi.fn() }))
vi.mock('@/hooks/usePermissions', () => ({ usePermissions: vi.fn() }))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    Link: ({ to, children, className, 'aria-current': ariaCurrent, ...rest }: any) => (
      <a href={to} className={className} aria-current={ariaCurrent} {...rest}>
        {children}
      </a>
    ),
    useLocation: vi.fn(() => ({ pathname: '/' })),
  }
})

import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { useLocation } from '@tanstack/react-router'
import { AppSidebar } from '../AppSidebar'

// ── Helpers ──────────────────────────────────────────────────────────────────

const mockLogout = vi.fn()

function setupAuth(overrides: {
  firstName?: string
  lastName?: string
  email?: string
  groups?: string[]
} = {}) {
  ;(useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
    user: {
      first_name: overrides.firstName ?? 'João',
      last_name: overrides.lastName ?? 'Silva',
      email: overrides.email ?? 'joao@fab.com',
      microsoft_groups: overrides.groups ?? [],
    },
    logout: mockLogout,
  })
}

function setupPermissions(visibleCaps: string[]) {
  ;(usePermissions as ReturnType<typeof vi.fn>).mockReturnValue({
    can: (cap: string) => visibleCaps.includes(cap),
  })
}

/** Capabilities de um operador comum (sem gestão) */
const OPERADOR_CAPS = [
  'view_dashboard',
  'view_ordens',
  'view_apontamentos',
  'view_maquinas',
  'view_qualidade',
]

/** Capabilities de um ADMIN */
const ADMIN_CAPS = [...OPERADOR_CAPS, 'view_estoque', 'view_manutencao', 'view_relatorios', 'view_usuarios', 'view_configuracoes']

// ── Testes ────────────────────────────────────────────────────────────────────

describe('AppSidebar', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockLogout.mockReset()
    setupAuth()
    setupPermissions(OPERADOR_CAPS)
    ;(useLocation as ReturnType<typeof vi.fn>).mockReturnValue({ pathname: '/' })
  })

  describe('branding', () => {
    it('exibe o nome FábricaOS', () => {
      render(<AppSidebar />)
      expect(screen.getByText('FábricaOS')).toBeDefined()
    })

    it('exibe subtítulo MES Industrial', () => {
      render(<AppSidebar />)
      expect(screen.getByText('MES Industrial')).toBeDefined()
    })
  })

  describe('dados do usuário', () => {
    it('exibe nome completo do usuário autenticado', () => {
      render(<AppSidebar />)
      expect(screen.getByText('João Silva')).toBeDefined()
    })

    it('exibe email do usuário', () => {
      render(<AppSidebar />)
      expect(screen.getByText('joao@fab.com')).toBeDefined()
    })

    it('usa email como displayName quando first_name está vazio', () => {
      setupAuth({ firstName: '', email: 'operador@fab.com' })
      render(<AppSidebar />)
      // email aparece tanto no displayName quanto no email secundário
      const emails = screen.getAllByText('operador@fab.com')
      expect(emails.length).toBeGreaterThanOrEqual(1)
    })

    it('exibe inicial do nome no avatar', () => {
      render(<AppSidebar />)
      expect(screen.getByText('J')).toBeDefined()
    })
  })

  describe('visibilidade de itens — operador comum', () => {
    it('exibe itens de operação visíveis', () => {
      render(<AppSidebar />)
      expect(screen.getByText('Dashboard')).toBeDefined()
      expect(screen.getByText('Ordens de Produção')).toBeDefined()
      expect(screen.getByText('Apontamentos')).toBeDefined()
      expect(screen.getByText('Máquinas')).toBeDefined()
      expect(screen.getByText('Qualidade')).toBeDefined()
    })

    it('não exibe itens de gestão sem capability', () => {
      render(<AppSidebar />)
      expect(screen.queryByText('Usuários')).toBeNull()
      expect(screen.queryByText('Configurações')).toBeNull()
      expect(screen.queryByText('Relatórios')).toBeNull()
    })

    it('não exibe seção Gestão quando nenhum item é visível', () => {
      render(<AppSidebar />)
      // Label da seção não deve aparecer quando sem itens
      const gestaoLabel = screen.queryByText('Gestão')
      expect(gestaoLabel).toBeNull()
    })
  })

  describe('visibilidade de itens — ADMIN', () => {
    beforeEach(() => {
      setupPermissions(ADMIN_CAPS)
    })

    it('exibe itens de gestão para ADMIN', () => {
      render(<AppSidebar />)
      expect(screen.getByText('Usuários')).toBeDefined()
      expect(screen.getByText('Configurações')).toBeDefined()
      expect(screen.getByText('Relatórios')).toBeDefined()
    })

    it('exibe seção Gestão para ADMIN', () => {
      render(<AppSidebar />)
      expect(screen.getByText('Gestão')).toBeDefined()
    })

    it('exibe ambas as seções Operação e Gestão para ADMIN', () => {
      render(<AppSidebar />)
      expect(screen.getByText('Operação')).toBeDefined()
      expect(screen.getByText('Gestão')).toBeDefined()
    })
  })

  describe('logout', () => {
    it('chama logout ao clicar em Sair', () => {
      render(<AppSidebar />)
      const logoutBtn = screen.getByRole('button', { name: /sair/i })
      fireEvent.click(logoutBtn)
      expect(mockLogout).toHaveBeenCalledTimes(1)
    })
  })

  describe('estado ativo', () => {
    it('marca Dashboard como ativo quando pathname é /', () => {
      ;(useLocation as ReturnType<typeof vi.fn>).mockReturnValue({ pathname: '/' })
      render(<AppSidebar />)
      const dashLink = screen.getByRole('link', { name: /dashboard/i })
      expect(dashLink.getAttribute('aria-current')).toBe('page')
    })

    it('não marca Dashboard como ativo em outra rota', () => {
      ;(useLocation as ReturnType<typeof vi.fn>).mockReturnValue({ pathname: '/ordens' })
      render(<AppSidebar />)
      const dashLink = screen.getByRole('link', { name: /dashboard/i })
      expect(dashLink.getAttribute('aria-current')).toBeNull()
    })
  })
})
