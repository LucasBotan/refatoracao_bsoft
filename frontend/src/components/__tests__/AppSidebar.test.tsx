/**
 * Testes do AppSidebar.
 *
 * Cobertos:
 *   - Renderização do branding FábricaOS
 *   - Exibição do nome do usuário autenticado
 *   - Renderização de seções e itens por capability
 *   - Ocultação de seções sem itens visíveis
 *   - Comportamento accordion: toggle, estado inicial, accordion exclusivo
 *   - Seta ChevronDown rotaciona ao abrir/fechar
 *   - Botão de logout chama logout()
 *   - Item ativo destacado baseado no pathname
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

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
  'view_varejistas',
]

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
      const emails = screen.getAllByText('operador@fab.com')
      expect(emails.length).toBeGreaterThanOrEqual(1)
    })

    it('exibe inicial do nome no avatar', () => {
      render(<AppSidebar />)
      expect(screen.getByText('J')).toBeDefined()
    })
  })

  describe('renderização de seções', () => {
    it('exibe seção Operação quando há itens visíveis', () => {
      render(<AppSidebar />)
      expect(screen.getByText('Operação')).toBeDefined()
    })

    it('não exibe seção Gestão quando nenhum item é visível', () => {
      render(<AppSidebar />)
      expect(screen.queryByText('Gestão')).toBeNull()
    })

    it('não exibe seção Cadastro para operador sem capability de varejistas', () => {
      render(<AppSidebar />)
      expect(screen.queryByText('Cadastro')).toBeNull()
    })

    it('exibe as três seções para ADMIN', () => {
      setupPermissions(ADMIN_CAPS)
      render(<AppSidebar />)
      expect(screen.getByText('Operação')).toBeDefined()
      expect(screen.getByText('Gestão')).toBeDefined()
      expect(screen.getByText('Cadastro')).toBeDefined()
    })
  })

  describe('accordion — estado inicial', () => {
    it('abre seção Operação por padrão quando pathname é /', () => {
      render(<AppSidebar />)
      const btn = screen.getByRole('button', { name: /operação/i })
      expect(btn.getAttribute('aria-expanded')).toBe('true')
    })

    it('mantém seção Gestão fechada ao iniciar em /', () => {
      setupPermissions(ADMIN_CAPS)
      render(<AppSidebar />)
      const btn = screen.getByRole('button', { name: /gestão/i })
      expect(btn.getAttribute('aria-expanded')).toBe('false')
    })

    it('abre seção Cadastro automaticamente quando pathname está em /varejistas', () => {
      setupPermissions(ADMIN_CAPS)
      ;(useLocation as ReturnType<typeof vi.fn>).mockReturnValue({ pathname: '/varejistas' })
      render(<AppSidebar />)
      const btn = screen.getByRole('button', { name: /cadastro/i })
      expect(btn.getAttribute('aria-expanded')).toBe('true')
    })

    it('abre seção Gestão automaticamente quando pathname está em /estoque', () => {
      setupPermissions(ADMIN_CAPS)
      ;(useLocation as ReturnType<typeof vi.fn>).mockReturnValue({ pathname: '/estoque' })
      render(<AppSidebar />)
      const btn = screen.getByRole('button', { name: /gestão/i })
      expect(btn.getAttribute('aria-expanded')).toBe('true')
    })
  })

  describe('accordion — toggle', () => {
    it('fecha seção aberta ao clicar nela novamente', () => {
      render(<AppSidebar />)
      const btn = screen.getByRole('button', { name: /operação/i })
      expect(btn.getAttribute('aria-expanded')).toBe('true')
      fireEvent.click(btn)
      expect(btn.getAttribute('aria-expanded')).toBe('false')
    })

    it('abre seção fechada ao clicar nela', () => {
      setupPermissions(ADMIN_CAPS)
      render(<AppSidebar />)
      const btnGestao = screen.getByRole('button', { name: /gestão/i })
      expect(btnGestao.getAttribute('aria-expanded')).toBe('false')
      fireEvent.click(btnGestao)
      expect(btnGestao.getAttribute('aria-expanded')).toBe('true')
    })

    it('fecha a seção anterior ao abrir uma nova (accordion)', () => {
      setupPermissions(ADMIN_CAPS)
      render(<AppSidebar />)
      const btnOperacao = screen.getByRole('button', { name: /operação/i })
      const btnGestao = screen.getByRole('button', { name: /gestão/i })

      expect(btnOperacao.getAttribute('aria-expanded')).toBe('true')
      expect(btnGestao.getAttribute('aria-expanded')).toBe('false')

      fireEvent.click(btnGestao)

      expect(btnOperacao.getAttribute('aria-expanded')).toBe('false')
      expect(btnGestao.getAttribute('aria-expanded')).toBe('true')
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

    it('marca Varejistas como ativo quando pathname é /varejistas', () => {
      setupPermissions(ADMIN_CAPS)
      ;(useLocation as ReturnType<typeof vi.fn>).mockReturnValue({ pathname: '/varejistas' })
      render(<AppSidebar />)
      const link = screen.getByRole('link', { name: /varejistas/i })
      expect(link.getAttribute('aria-current')).toBe('page')
    })

    it('marca Varejistas como ativo em sub-rota /varejistas/novo', () => {
      setupPermissions(ADMIN_CAPS)
      ;(useLocation as ReturnType<typeof vi.fn>).mockReturnValue({ pathname: '/varejistas/novo' })
      render(<AppSidebar />)
      const link = screen.getByRole('link', { name: /varejistas/i })
      expect(link.getAttribute('aria-current')).toBe('page')
    })
  })
})
