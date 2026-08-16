import './App.css'

function App() {
  return (
    <main className="not-found">
      <div className="glow glow-one" />
      <div className="glow glow-two" />
      <div className="glow glow-three" />

      <div className="card">
        <div className="diamond" aria-hidden="true">
          <span className="diamond-inner" />
          <span className="diamond-shine" />
        </div>
        <div className="code">404</div>
        <h1>Pagina no encontrada</h1>
        <p>El diamante que buscas no existe en esta mina.</p>
        <a href="/" className="btn">Volver al inicio</a>
      </div>

      <span className="spark spark-one" aria-hidden="true" />
      <span className="spark spark-two" aria-hidden="true" />
      <span className="spark spark-three" aria-hidden="true" />
      <span className="spark spark-four" aria-hidden="true" />
    </main>
  )
}

export default App