/**
 * Testes do guarda de rota RequireAuth.
 *
 * Cobertos: loader durante bootstrap, loader durante fetch do CT,
 * redirect para /login sem auth, redirect para /sem-ct sem CT,
 * renderiza children quando autenticado e com CT.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RequireAuth } from '../RequireAuth'

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/hooks/useUserCT', () => ({
  useUserCT: vi.fn(),
}))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
  }
})

import { useAuth } from '@/hooks/useAuth'
import { useUserCT } from '@/hooks/useUserCT'

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

function mockUserCT(overrides: Partial<ReturnType<typeof useUserCT>> = {}) {
  ;(useUserCT as ReturnType<typeof vi.fn>).mockReturnValue({
    userCT: null,
    isLoadingCT: false,
    ...overrides,
  })
}

const ctComAcesso = {
  nome: 'João',
  email: 'joao@empresa.com',
  ct: 'CT001',
  nome_centro_trabalho: 'Curitiba',
  usuario_sem_ct: false,
}

const ctSemAcesso = { ...ctComAcesso, ct: null, nome_centro_trabalho: null, usuario_sem_ct: true }

describe('RequireAuth', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockAuth()
    mockUserCT()
  })

  it('exibe loader enquanto AuthContext ainda bootstrapping', () => {
    mockAuth({ isLoading: true })
    mockUserCT({ userCT: null, isLoadingCT: false })
    render(<RequireAuth><div>protected</div></RequireAuth>)
    expect(screen.getByText(/Verificando sessão/i)).toBeDefined()
    expect(screen.queryByText('protected')).toBeNull()
  })

  it('exibe loader enquanto CT está sendo carregado', () => {
    mockAuth({ isAuthenticated: true, isLoading: false })
    mockUserCT({ userCT: null, isLoadingCT: true })
    render(<RequireAuth><div>protected</div></RequireAuth>)
    expect(screen.getByText(/Verificando sessão/i)).toBeDefined()
    expect(screen.queryByText('protected')).toBeNull()
  })

  it('exibe loader no estado transiente: autenticado mas CT ainda null', () => {
    mockAuth({ isAuthenticated: true, isLoading: false })
    mockUserCT({ userCT: null, isLoadingCT: false })
    render(<RequireAuth><div>protected</div></RequireAuth>)
    expect(screen.getByText(/Verificando sessão/i)).toBeDefined()
    expect(screen.queryByText('protected')).toBeNull()
  })

  it('redireciona para /login quando não autenticado', () => {
    mockAuth({ isAuthenticated: false, isLoading: false })
    mockUserCT({ userCT: null, isLoadingCT: false })
    render(<RequireAuth><div>protected</div></RequireAuth>)
    const nav = screen.getByTestId('navigate')
    expect(nav.getAttribute('data-to')).toBe('/login')
    expect(screen.queryByText('protected')).toBeNull()
  })

  it('redireciona para /sem-ct quando usuario_sem_ct é true', () => {
    mockAuth({ isAuthenticated: true, isLoading: false })
    mockUserCT({ userCT: ctSemAcesso, isLoadingCT: false })
    render(<RequireAuth><div>protected</div></RequireAuth>)
    const nav = screen.getByTestId('navigate')
    expect(nav.getAttribute('data-to')).toBe('/sem-ct')
    expect(screen.queryByText('protected')).toBeNull()
  })

  it('renderiza children quando autenticado e com CT', () => {
    mockAuth({ isAuthenticated: true, isLoading: false })
    mockUserCT({ userCT: ctComAcesso, isLoadingCT: false })
    render(<RequireAuth><div>protected content</div></RequireAuth>)
    expect(screen.getByText('protected content')).toBeDefined()
    expect(screen.queryByTestId('navigate')).toBeNull()
  })
})
