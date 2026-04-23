/**
 * Testes do guarda de rota RequireAuth.
 *
 * Cobertos: loader durante bootstrap, redirect para /login sem auth,
 * renderiza children quando autenticado.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { RequireAuth } from '../RequireAuth'

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
  }
})

import { useAuth } from '@/hooks/useAuth'

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

describe('RequireAuth', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockAuth()
  })

  it('exibe loader enquanto isLoading é true', () => {
    mockAuth({ isLoading: true })
    render(<RequireAuth><div>protected</div></RequireAuth>)
    expect(screen.getByText(/Verificando sessão/i)).toBeDefined()
    expect(screen.queryByText('protected')).toBeNull()
  })

  it('redireciona para /login quando não autenticado', () => {
    mockAuth({ isAuthenticated: false, isLoading: false })
    render(<RequireAuth><div>protected</div></RequireAuth>)
    const nav = screen.getByTestId('navigate')
    expect(nav.getAttribute('data-to')).toBe('/login')
    expect(screen.queryByText('protected')).toBeNull()
  })

  it('renderiza children quando autenticado', () => {
    mockAuth({ isAuthenticated: true, isLoading: false })
    render(<RequireAuth><div>protected content</div></RequireAuth>)
    expect(screen.getByText('protected content')).toBeDefined()
    expect(screen.queryByTestId('navigate')).toBeNull()
  })
})
