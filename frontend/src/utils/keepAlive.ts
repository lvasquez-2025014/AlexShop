const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
const INTERVAL_MS = 10 * 60 * 1000

let started = false

export function startKeepAlive() {
  if (started) return
  started = true

  const ping = () => {
    fetch(`${API_URL}/health`, { method: 'GET' })
      .then((res) => res.json())
      .catch(() => {
        // backend dormido o apagado: reintentar en el siguiente ciclo
      })
  }

  ping()
  setInterval(ping, INTERVAL_MS)
}