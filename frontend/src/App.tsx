import './App.css'

function App() {
  return (
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
  )
}

export default App