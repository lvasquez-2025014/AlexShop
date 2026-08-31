import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'

export interface User {
  id: string
  email: string
  name: string
  picture: string
  role: 'admin' | 'client'
  ffName: string
  ffId: string
}

interface AuthContextValue {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: (credential: string) => Promise<void>
  loginAsGuest: () => void
  updateProfile: (data: { ffName?: string; ffId?: string }) => Promise<void>
  logout: () => Promise<void>
  authFetch: (path: string, init?: RequestInit) => Promise<Response>
}

const SESSION_KEY = 'alexshop-user'
const ACCESS_TOKEN_KEY = 'alexshop-access-token'
const REFRESH_TOKEN_KEY = 'alexshop-refresh-token'
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export const GUEST_EMAIL = 'invitado@alexshop.com'

const AuthContext = createContext<AuthContextValue | null>(null)

/** Decodifica un JWT y devuelve su `exp` (en segundos Unix). 0 si inválido. */
function getJwtExp(token: string): number {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return 0
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.exp === 'number' ? payload.exp : 0
  } catch {
    return 0
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = sessionStorage.getItem(SESSION_KEY)
    return stored ? (JSON.parse(stored) as User) : null
  })
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    sessionStorage.getItem(ACCESS_TOKEN_KEY)
  )
  const [, setRefreshToken] = useState<string | null>(() =>
    sessionStorage.getItem(REFRESH_TOKEN_KEY)
  )
  const [loading, setLoading] = useState(false)

  const refreshTimerRef = useRef<number | null>(null)

  const persist = useCallback(
    (nextUser: User, nextAccess: string, nextRefresh: string) => {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextUser))
      sessionStorage.setItem(ACCESS_TOKEN_KEY, nextAccess)
      sessionStorage.setItem(REFRESH_TOKEN_KEY, nextRefresh)
      setUser(nextUser)
      setAccessToken(nextAccess)
      setRefreshToken(nextRefresh)
    },
    []
  )

  const clearSession = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem(ACCESS_TOKEN_KEY)
    sessionStorage.removeItem(REFRESH_TOKEN_KEY)
    setUser(null)
    setAccessToken(null)
    setRefreshToken(null)
  }, [])

  /** Refresca el access token. Devuelve el nuevo token o null si falló. */
  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    const currentRefresh = sessionStorage.getItem(REFRESH_TOKEN_KEY)
    if (!currentRefresh) return null

    try {
      const res = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: currentRefresh }),
      })

      if (!res.ok) {
        clearSession()
        return null
      }

      const data = await res.json()
      sessionStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken)
      sessionStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken)
      setAccessToken(data.accessToken)
      setRefreshToken(data.refreshToken)
      return data.accessToken
    } catch {
      return null
    }
  }, [clearSession])

  /** Programa el refresh automático 1 minuto antes de que expire el access token. */
  useEffect(() => {
    if (refreshTimerRef.current) {
      window.clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = null
    }
    if (!accessToken) return

    const exp = getJwtExp(accessToken)
    const nowSec = Math.floor(Date.now() / 1000)
    const msUntilRefresh = Math.max(0, (exp - nowSec - 60) * 1000)

    refreshTimerRef.current = window.setTimeout(() => {
      refreshAccessToken().catch(() => {
        clearSession()
      })
    }, msUntilRefresh)

    return () => {
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current)
        refreshTimerRef.current = null
      }
    }
  }, [accessToken, refreshAccessToken, clearSession])

  /**
   * Helper para hacer fetch autenticado. Si recibe 401, intenta refrescar
   * el token una sola vez y reintenta la petición.
   */
  const authFetch = useCallback(
    async (path: string, init: RequestInit = {}): Promise<Response> => {
      const url = path.startsWith('http') ? path : `${API_URL}${path}`
      const tokenNow = sessionStorage.getItem(ACCESS_TOKEN_KEY)

      const headers: Record<string, string> = {
        ...((init.headers as Record<string, string>) ?? {}),
      }
      if (tokenNow) {
        headers['Authorization'] = `Bearer ${tokenNow}`
      }

      let res = await fetch(url, { ...init, headers })

      if (res.status === 401 && tokenNow) {
        const newToken = await refreshAccessToken()
        if (newToken) {
          headers['Authorization'] = `Bearer ${newToken}`
          res = await fetch(url, { ...init, headers })
        } else {
          clearSession()
        }
      }

      return res
    },
    [refreshAccessToken, clearSession]
  )

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true)
      try {
        const res = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error ?? 'Error al iniciar sesión')
        }

        const data = await res.json()
        persist(data.user, data.accessToken, data.refreshToken)
      } finally {
        setLoading(false)
      }
    },
    [persist]
  )

  const loginWithGoogle = useCallback(
    async (credential: string) => {
      setLoading(true)
      try {
        const res = await fetch(`${API_URL}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error ?? 'Error al autenticar con Google')
        }

        const data = await res.json()
        persist(data.user, data.accessToken, data.refreshToken)
      } finally {
        setLoading(false)
      }
    },
    [persist]
  )

  const updateProfile = useCallback(
    async (data: { ffName?: string; ffId?: string }) => {
      const res = await authFetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Error al guardar perfil')
      }

      const result = await res.json()
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(result.user))
      setUser(result.user)
    },
    [authFetch]
  )

  const loginAsGuest = useCallback(() => {
    const guestUser: User = {
      id: 'guest',
      email: GUEST_EMAIL,
      name: 'Invitado',
      picture: '',
      role: 'client',
      ffName: '',
      ffId: '',
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(guestUser))
    sessionStorage.removeItem(ACCESS_TOKEN_KEY)
    sessionStorage.removeItem(REFRESH_TOKEN_KEY)
    setUser(guestUser)
    setAccessToken(null)
    setRefreshToken(null)
  }, [])

  const logout = useCallback(async () => {
    const tokenNow = sessionStorage.getItem(ACCESS_TOKEN_KEY)
    if (tokenNow) {
      // Notificar al backend para revocar la sesión (best-effort).
      try {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${tokenNow}` },
        })
      } catch {
        // Ignorar errores de red al cerrar sesión.
      }
    }
    clearSession()
  }, [clearSession])

  return (
    <AuthContext.Provider
      value={{
        user,
        token: accessToken,
        loading,
        login,
        loginWithGoogle,
        loginAsGuest,
        updateProfile,
        logout,
        authFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return ctx
}