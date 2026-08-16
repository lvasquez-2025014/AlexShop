import { useAuth } from '../auth/AuthContext'
import './Dashboard.css'

export default function Dashboard() {
  const { user, logout } = useAuth()

  return (
    <>
      <header className="dash-header">
        <div className="dash-brand">
          <span className="dash-logo" aria-hidden="true">
            <span className="dash-diamond" />
          </span>
          <span>AlexShop</span>
        </div>

        <div className="dash-user">
          <span className="dash-email">{user?.email}</span>
          <button type="button" className="dash-logout" onClick={logout}>
            Cerrar sesion
          </button>
        </div>
      </header>

      <main className="not-found">
        <div className="card">
          <span className="label">Error 404</span>
          <h1>Pagina no encontrada</h1>
          <p>
            La pagina que buscas no existe o fue movida.
            Verifica la URL o vuelve al inicio.
          </p>
          <a href="/" className="btn">Volver al inicio</a>
        </div>
      </main>
    </>
  )
}