/**
 * Testes da tela de login.
 *
 * Cobertos: renderização, estado de loading, erro de callback,
 * redirecionamento de usuário já autenticado e disparo do SSO.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/services/authService', () => ({
  getLoginUrl: () => 'http://localhost:8000/auth/login/',
}))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    createFileRoute: () => ({ component: (c: React.FC) => c }),
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
    useNavigate: () => vi.fn(),
  }
})

import { useAuth } from '@/hooks/useAuth'

// Importa após mocks
const { LoginPage } = await import('../login').then(async (m) => {
  // createFileRoute retorna o componente diretamente no mock
  return { LoginPage: (m as unknown as { Route: { component: React.FC } }).Route.component }
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function mockAuth(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
  ;(useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    accessToken: null,
    setTokens: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  })
}

function renderLogin() {
  return render(<LoginPage />)
}

// ── Testes ────────────────────────────────────────────────────────────────────

describe('LoginPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    // Garante hash limpo a cada teste
    window.history.replaceState(null, '', '/')
    mockAuth()
  })

  it('renderiza o branding FábricaOS', () => {
    renderLogin()
    expect(screen.getByText('FábricaOS')).toBeDefined()
    expect(screen.getByText('MES Enterprise Suite')).toBeDefined()
    expect(screen.getByText(/Sistema de Gestão de/i)).toBeDefined()
  })

  it('exibe o botão de SSO', () => {
    renderLogin()
    expect(screen.getByRole('button', { name: /Entrar com conta corporativa/i })).toBeDefined()
  })

  it('não exibe campos de email ou senha', () => {
    renderLogin()
    expect(screen.queryByLabelText(/e-mail/i)).toBeNull()
    expect(screen.queryByLabelText(/senha/i)).toBeNull()
  })

  it('exibe estado de loading enquanto auth está carregando', () => {
    mockAuth({ isLoading: true })
    renderLogin()
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
  })

  it('redireciona para / quando o usuário já está autenticado', () => {
    mockAuth({ isAuthenticated: true, isLoading: false })
    renderLogin()
    const nav = screen.getByTestId('navigate')
    expect(nav.getAttribute('data-to')).toBe('/')
  })

  it('exibe mensagem de erro vinda do hash #error=invalid_state', () => {
    window.history.replaceState(null, '', '/#error=invalid_state')
    renderLogin()
    expect(screen.getByText(/A sessão de login expirou/i)).toBeDefined()
  })

  it('redireciona o navegador para a URL de login do backend ao clicar', () => {
    const hrefSpy = vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      hash: '',
    } as Location)
    const assignSpy = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { ...window.location, href: '', hash: '' },
      writable: true,
    })

    renderLogin()
    const btn = screen.getByRole('button', { name: /Entrar com conta corporativa/i })
    fireEvent.click(btn)

    expect((window.location as Location & { href: string }).href).toBe(
      'http://localhost:8000/auth/login/',
    )
    hrefSpy.mockRestore()
    assignSpy.mockRestore()
  })

  it('desabilita o botão e exibe "Redirecionando…" após clique', () => {
    renderLogin()
    const btn = screen.getByRole('button', { name: /Entrar com conta corporativa/i })
    fireEvent.click(btn)
    expect(btn).toBeDisabled()
    expect(screen.getByText(/Redirecionando/i)).toBeDefined()
  })
})
