import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import {
  packages,
  passes,
  type ShopPackage,
} from '../data/mockData'
import './Dashboard.css'

type Page = 'inicio' | 'diamantes' | 'pases' | 'ranking'
type Period = 'Dia' | 'Semana' | 'Mes' | 'Anio'

const periods: Period[] = ['Dia', 'Semana', 'Mes', 'Anio']

const currencies = [
  { code: 'MXN', flag: 'fi fi-mx' },
  { code: 'GTQ', flag: 'fi fi-gt' },
  { code: 'USD', flag: 'fi fi-us' },
]

function money(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2 })
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [page, setPage] = useState<Page>('inicio')
  const [menuOpen, setMenuOpen] = useState(false)
  const [selected, setSelected] = useState<ShopPackage | null>(null)
  const [playerId, setPlayerId] = useState('')
  const [period, setPeriod] = useState<Period>('Dia')
  const [toast, setToast] = useState<string | null>(null)
  const [currency, setCurrency] = useState('MXN')
  const [currencyOpen, setCurrencyOpen] = useState(false)

  const showToast = (text: string) => {
    setToast(text)
    window.setTimeout(() => setToast(null), 2400)
  }

  const selectPackage = (pkg: ShopPackage) => {
    setSelected(pkg)
    if (page !== 'diamantes') {
      setPage('diamantes')
    }
  }

  const confirmPurchase = () => {
    if (!playerId.trim()) {
      showToast('Introduce tu ID de jugador')
      return
    }
    showToast('Compra preparada (demo: conecta el backend aqui)')
  }

  const goTo = (next: Page) => {
    setPage(next)
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const navItems: { id: Page; label: string }[] = [
    { id: 'inicio', label: 'Inicio' },
    { id: 'diamantes', label: 'Diamantes' },
    { id: 'pases', label: 'Pases Elite' },
    { id: 'ranking', label: 'Ranking' },
  ]

  return (
    <div className="dash">
      <header className="topbar">
        <button className="logo" onClick={() => goTo('inicio')}>
          <span className="logo-mark" aria-hidden="true">
            <span className="logo-diamond" />
          </span>
          AlexShop<span className="logo-dot">.</span>
        </button>

        <nav className={`nav ${menuOpen ? 'open' : ''}`}>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={page === item.id ? 'active' : ''}
              onClick={() => goTo(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className={`actions ${menuOpen ? 'open' : ''}`}>
          <div className="currency-wrap">
            <button
              className="currency"
              onClick={() => setCurrencyOpen(!currencyOpen)}
            >
              <span className={currencies.find((c) => c.code === currency)?.flag} />
              {currency} ⌄
            </button>
            {currencyOpen && (
              <div className="currency-menu">
                {currencies.map((c) => (
                  <button
                    key={c.code}
                    className={currency === c.code ? 'active' : ''}
                    onClick={() => {
                      setCurrency(c.code)
                      setCurrencyOpen(false)
                    }}
                  >
                    <span className={c.flag} />
                    {c.code}
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="user-chip">{user?.name}</span>
          <button className="logout-btn" onClick={logout}>
            Cerrar sesion
          </button>
        </div>

        <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? '×' : '☰'}
        </button>
      </header>

      <main>
        {page === 'inicio' && (
          <section className="page active">
            <div className="hero-grid">
              <div className="intro">
                <div className="eyebrow">RECARGAS INSTANTANEAS</div>
                <h1>
                  Free
                  <br />
                  Fire
                  <br />
                  <span>Recarga</span>
                </h1>
                <p className="intro-copy">
                  Elige tu paquete, paga con tu metodo favorito y recibe tus
                  diamantes de forma rapida y sencilla.
                </p>
                <div className="steps">
                  <div className="step"><b>1</b> Elige tu paquete</div>
                  <div className="step"><b>2</b> Paga con multiples opciones</div>
                  <div className="step"><b>3</b> Recibe tus diamantes</div>
                </div>
                <div className="payment-box">
                  <div className="payment-title">METODOS DE PAGO</div>
                  <div className="payment-list">
                    <span className="pay">NEQUI</span>
                    <span className="pay">DAVIPLATA</span>
                    <span className="pay">PAYPAL</span>
                    <span className="pay">+40</span>
                  </div>
                </div>
              </div>

              <div className="section-card packages">
                <div className="card-heading">
                  <h2>Elige tu recarga</h2>
                  <span className="breadcrumb">ID DE JUGADOR → PAGO → ENTREGA</span>
                </div>
                <div className="package-grid">
                  {packages.map((pkg) => (
                    <article
                      key={pkg.id}
                      className={`package ${pkg.popular ? 'popular' : ''}`}
                      onClick={() => selectPackage(pkg)}
                    >
                      {pkg.popular && <div className="badge">POPULAR</div>}
                      <div className="diamond-art" />
                      <div className="amount">{pkg.diamonds} ◆</div>
                      <div className="bonus">
                        {pkg.diamonds - pkg.bonus} + {pkg.bonus} bonus
                      </div>
                      <div className="price">{money(pkg.price)}</div>
                    </article>
                  ))}
                </div>
              </div>

              <aside className="section-card ranking">
                <div className="rank-title">
                  <svg className="crown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m2 8 3.5 3L12 5l6.5 6L22 8l-1.5 9h-17L2 8Z" />
                    <path d="M5.5 21h13" />
                  </svg>
                  Top compradores
                </div>
                <div className="tabs">
                  {periods.map((p) => (
                    <button
                      key={p}
                      className={period === p ? 'active' : ''}
                      onClick={() => setPeriod(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div className="empty-state">
                  <span className="empty-icon">◆</span>
                  <strong>Aun no hay compradores</strong>
                  <span>El ranking se llenara con datos reales de la base de datos.</span>
                </div>
              </aside>
            </div>

            <section className="fame">
              <div className="fame-head">
                <svg className="crown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m2 8 3.5 3L12 5l6.5 6L22 8l-1.5 9h-17L2 8Z" />
                  <path d="M5.5 21h13" />
                </svg>
                SALON DE LA FAMA · TOP DONADORES
              </div>
              <div className="empty-state fame-empty">
                <span className="empty-icon">♕</span>
                <strong>Sin datos por ahora</strong>
                <span>Los mejores donadores apareceran aqui cuando haya compras reales.</span>
              </div>
            </section>
          </section>
        )}

        {page === 'diamantes' && (
          <section className="page active">
            <div className="sub-hero">
              <div>
                <div className="eyebrow">FREE FIRE · STORE</div>
                <h1>
                  Compra tus <span>diamantes</span>
                </h1>
              </div>
              <p>
                Selecciona una cantidad, introduce tu ID de jugador y continua
                al proceso de pago.
              </p>
            </div>
            <div className="product-page-grid">
              <div className="big-products">
                {packages.map((pkg) => (
                  <article className="big-product" key={pkg.id}>
                    <div className="diamond-art" />
                    <div>
                      <h3>{pkg.diamonds} ◆</h3>
                      <p>
                        {pkg.diamonds - pkg.bonus} + {pkg.bonus} bonus
                      </p>
                      <strong className="product-price">{money(pkg.price)}</strong>
                      <button className="buy" onClick={() => selectPackage(pkg)}>
                        Comprar
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <aside className="checkout-panel">
                <h3>Datos de entrega</h3>
                <div className="field">
                  <label>ID del jugador</label>
                  <input
                    value={playerId}
                    onChange={(event) => setPlayerId(event.target.value)}
                    placeholder="Ej. 123456789"
                  />
                </div>
                <div className="field">
                  <label>Servidor / region</label>
                  <input value="LATAM" readOnly />
                </div>
                <div className="notice">
                  Los datos mostrados son una demostracion. Conecta aqui tu
                  backend y proveedor de pagos para convertirlo en un sistema
                  real.
                </div>
                <div className="total">
                  <span>Total</span>
                  <strong>{selected ? money(selected.price) : '$0.00'}</strong>
                </div>
                <button className="buy wide" onClick={confirmPurchase}>
                  Continuar
                </button>
              </aside>
            </div>
          </section>
        )}

        {page === 'pases' && (
          <section className="page active">
            <div className="sub-hero">
              <div>
                <div className="eyebrow">PASES ELITE</div>
                <h1>
                  Pases al <span>mejor precio</span>
                </h1>
              </div>
              <p>
                Compra tus pases elite y de temporada con entrega inmediata.
              </p>
            </div>
            <div className="big-products">
              {passes.map((pkg) => (
                <article className="big-product" key={pkg.id}>
                  <div className="diamond-art small" />
                  <div>
                    <h3>{pkg.diamonds} ◆</h3>
                    <p>Pase Elite · entrega inmediata</p>
                    <strong className="product-price">{money(pkg.price)}</strong>
                    <button className="buy" onClick={() => selectPackage(pkg)}>
                      Comprar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {page === 'ranking' && (
          <section className="page active">
            <div className="sub-hero">
              <div>
                <div className="eyebrow">LEADERBOARD</div>
                <h1>
                  Top <span>compradores</span>
                </h1>
              </div>
              <p>
                Ranking dinamico por periodo. Los datos de esta demo se generan
                desde datos de ejemplo.
              </p>
            </div>
            <div className="section-card packages">
              <div className="tabs full-tabs">
                {periods.map((p) => (
                  <button
                    key={p}
                    className={period === p ? 'active' : ''}
                    onClick={() => setPeriod(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div className="empty-state">
                <span className="empty-icon">◆</span>
                <strong>El ranking esta vacio</strong>
                <span>Cuando existan compras en la base de datos, los jugadores apareceran aqui.</span>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <span>© 2026 AlexShop · DEMO UI</span>
        <span>PRIVACIDAD · TERMINOS · SOPORTE</span>
      </footer>

      {toast && <div className="toast show">{toast}</div>}
    </div>
  )
}