import { AuthProvider, useAuth } from './auth/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

function AppRoutes() {
  const { user } = useAuth()
  return user ? <Dashboard /> : <Login />
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App