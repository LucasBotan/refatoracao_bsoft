/**
 * Testes da rota /callback (receptor OAuth2).
 *
 * Cobertos: tokens válidos no hash → setTokens → navigate para /,
 * hash de erro → mensagem genérica ao usuário,
 * hash vazio → mensagem de resposta incompleta.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockSetTokens = vi.fn()
const mockNavigate = vi.fn()

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    setTokens: mockSetTokens,
    isAuthenticated: false,
    isLoading: false,
    user: null,
    accessToken: null,
    logout: vi.fn(),
  }),
}))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    createFileRoute: () => ({ component: (c: React.FC) => c }),
    useNavigate: () => mockNavigate,
  }
})

const { CallbackPage } = await import('../callback').then((m) => ({
  CallbackPage: (m as unknown as { Route: { component: React.FC } }).Route.component,
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function setHash(hash: string) {
  Object.defineProperty(window, 'location', {
    value: { ...window.location, hash, pathname: '/callback' },
    writable: true,
  })
}

function renderCallback() {
  return render(<CallbackPage />)
}

// ── Testes ────────────────────────────────────────────────────────────────────

describe('CallbackPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockSetTokens.mockResolvedValue(undefined)
    mockNavigate.mockResolvedValue(undefined)
  })

  it('exibe loader enquanto processa', () => {
    setHash('#access_token=abc&refresh_token=xyz')
    renderCallback()
    expect(screen.getByText(/Autenticando/i)).toBeDefined()
  })

  it('chama setTokens e navega para / com tokens válidos', async () => {
    setHash('#access_token=tok123&refresh_token=ref456')
    renderCallback()

    await waitFor(() => {
      expect(mockSetTokens).toHaveBeenCalledWith({
        access_token: 'tok123',
        refresh_token: 'ref456',
      })
    })
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/', replace: true })
    })
  })

  it('exibe erro genérico ao receber #error=invalid_state', async () => {
    setHash('#error=invalid_state')
    renderCallback()

    await waitFor(() => {
      expect(screen.getByText(/Falha na autenticação/i)).toBeDefined()
      expect(screen.getByText(/Requisição inválida ou expirada/i)).toBeDefined()
    })
  })

  it('exibe erro quando hash está vazio', async () => {
    setHash('')
    renderCallback()

    await waitFor(() => {
      expect(screen.getByText(/Falha na autenticação/i)).toBeDefined()
    })
  })

  it('exibe erro quando setTokens rejeita', async () => {
    setHash('#access_token=bad&refresh_token=bad')
    mockSetTokens.mockRejectedValueOnce(new Error('profile_fetch_failed'))
    renderCallback()

    await waitFor(() => {
      expect(screen.getByText(/Não foi possível iniciar a sessão/i)).toBeDefined()
    })
  })
})
