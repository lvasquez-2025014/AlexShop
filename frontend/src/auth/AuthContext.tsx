import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react'

export interface User {
  email: string
  name: string
}

interface AuthContextValue {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  loginAsGuest: () => void
  logout: () => void
}

const SESSION_KEY = 'alexshop-user'

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = sessionStorage.getItem(SESSION_KEY)
    return stored ? (JSON.parse(stored) as User) : null
  })

  const login = async (email: string, password: string) => {
    await new Promise((resolve) => setTimeout(resolve, 700))
    if (!email.includes('@') || password.length < 6) {
      throw new Error('Email o contrasena invalidos')
    }
    const nextUser: User = {
      email,
      name: email.split('@')[0] ?? email,
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextUser))
    setUser(nextUser)
  }

  const loginAsGuest = () => {
    const guestUser: User = { email: 'invitado@alexshop.com', name: 'Invitado' }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(guestUser))
    setUser(guestUser)
  }

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, loginAsGuest, logout }}>
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