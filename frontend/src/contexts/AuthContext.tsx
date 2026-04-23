/**
 * AuthContext — fonte de verdade do estado de autenticação na SPA.
 *
 * Estratégia de armazenamento de tokens:
 *   access_token  → memória React (state) — não persiste, seguro.
 *   refresh_token → sessionStorage        — persiste dentro da aba,
 *                                           limpa ao fechar o browser.
 *                                           RISCO: visível em JS; migrar para
 *                                           cookie HttpOnly em produção (BFF).
 */
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  type AuthUser,
  type TokenPair,
  fetchProfile,
  refreshAccessToken,
} from '@/services/authService'

const REFRESH_TOKEN_KEY = 'fabrica_os_rt'

export interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  /** Armazena tokens recebidos após callback OAuth2. */
  setTokens: (tokens: TokenPair) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const bootstrapped = useRef(false)

  const logout = useCallback(() => {
    setUser(null)
    setAccessToken(null)
    sessionStorage.removeItem(REFRESH_TOKEN_KEY)
  }, [])

  const hydrateFromTokens = useCallback(
    async (tokens: TokenPair) => {
      try {
        const profile = await fetchProfile(tokens.access_token)
        setAccessToken(tokens.access_token)
        sessionStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token)
        setUser(profile)
      } catch {
        logout()
      }
    },
    [logout],
  )

  const setTokens = useCallback(
    async (tokens: TokenPair) => {
      await hydrateFromTokens(tokens)
    },
    [hydrateFromTokens],
  )

  // Inicialização: tenta reutilizar a sessão via refresh_token em sessionStorage.
  useEffect(() => {
    if (bootstrapped.current) return
    bootstrapped.current = true

    const storedRefresh = sessionStorage.getItem(REFRESH_TOKEN_KEY)
    if (!storedRefresh) {
      setIsLoading(false)
      return
    }

    refreshAccessToken(storedRefresh)
      .then(hydrateFromTokens)
      .catch(logout)
      .finally(() => setIsLoading(false))
  }, [hydrateFromTokens, logout])

  const value = useMemo<AuthState>(
    () => ({
      user,
      accessToken,
      isAuthenticated: user !== null && accessToken !== null,
      isLoading,
      setTokens,
      logout,
    }),
    [user, accessToken, isLoading, setTokens, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
