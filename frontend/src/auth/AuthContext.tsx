import {
  createContext,
  useContext,
  useState,
  useCallback,
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
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: (credential: string) => Promise<void>
  loginAsGuest: () => void
  updateProfile: (data: { ffName?: string; ffId?: string }) => Promise<void>
  logout: () => void
}

const SESSION_KEY = 'alexshop-user'
const TOKEN_KEY = 'alexshop-token'
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export const GUEST_EMAIL = 'invitado@alexshop.com'

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = sessionStorage.getItem(SESSION_KEY)
    return stored ? (JSON.parse(stored) as User) : null
  })
  const [token, setToken] = useState<string | null>(() =>
    sessionStorage.getItem(TOKEN_KEY)
  )

  const persist = useCallback((nextUser: User, nextToken: string) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextUser))
    sessionStorage.setItem(TOKEN_KEY, nextToken)
    setUser(nextUser)
    setToken(nextToken)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error ?? 'Error al iniciar sesion')
    }

    const data = await res.json()
    persist(data.user, data.token)
  }, [persist])

  const loginWithGoogle = useCallback(async (credential: string) => {
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
    persist(data.user, data.token)
  }, [persist])

  const updateProfile = useCallback(
    async (data: { ffName?: string; ffId?: string }) => {
      if (!token) throw new Error('No autorizado')

      const res = await fetch(`${API_URL}/api/user/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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
    [token]
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
    sessionStorage.removeItem(TOKEN_KEY)
    setUser(guestUser)
    setToken(null)
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
    setUser(null)
    setToken(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, login, loginWithGoogle, loginAsGuest, updateProfile, logout }}>
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