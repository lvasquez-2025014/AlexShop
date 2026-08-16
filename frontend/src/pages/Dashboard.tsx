import { useEffect, useState } from 'react'
import { GUEST_EMAIL, useAuth } from '../auth/AuthContext'
import {
  packages,
  passes,
  featuredPass,
  type ShopPackage,
} from '../data/mockData'
import './Dashboard.css'

type Page = 'inicio' | 'diamantes' | 'pases' | 'ranking'
type Period = 'Dia' | 'Semana' | 'Mes' | 'Anio'

const periods: Period[] = ['Dia', 'Semana', 'Mes', 'Anio']

const currencyConfig: Record<string, { flag: string; rate: number; symbol: string }> = {
  MXN: { flag: 'fi fi-mx', rate: 1, symbol: 'MX$' },
  GTQ: { flag: 'fi fi-gt', rate: 7.7 / 18.5, symbol: 'Q' },
  USD: { flag: 'fi fi-us', rate: 1 / 18.5, symbol: '$' },
}

const PENDING_KEY = 'alexshop-pending'

const currencies = Object.entries(currencyConfig).map(([code, c]) => ({
  code,
  flag: c.flag,
}))

export default function Dashboard() {
  const { user, logout } = useAuth()
  const isGuest = user?.email === GUEST_EMAIL
  const [page, setPage] = useState<Page>('inicio')
  const [menuOpen, setMenuOpen] = useState(false)
  const [selected, setSelected] = useState<ShopPackage | null>(null)
  const [playerId, setPlayerId] = useState('')
  const [period, setPeriod] = useState<Period>('Dia')
  const [toast, setToast] = useState<string | null>(null)
  const [currency, setCurrency] = useState('MXN')
  const [currencyOpen, setCurrencyOpen] = useState(false)
  const [authModal, setAuthModal] = useState(false)

  useEffect(() => {
    const pendingId = sessionStorage.getItem(PENDING_KEY)
    if (pendingId && !isGuest) {
      sessionStorage.removeItem(PENDING_KEY)
      const pkg = [...packages, ...passes].find((p) => p.id === pendingId)
      if (pkg) {
        setSelected(pkg)
        setPage('diamantes')
        setToast(`Bienvenido! Tu compra de ${pkg.diamonds} ◆ esta lista`)
        window.setTimeout(() => setToast(null), 2600)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const money = (n: number) => {
    const { rate, symbol } = currencyConfig[currency]
    const value = n * rate
    if (currency === 'USD') {
      return symbol + value.toLocaleString('en-US', { minimumFractionDigits: 2 })
    }
    return symbol + Math.round(value).toLocaleString('en-US')
  }

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

  const requireAccount = (pkg: ShopPackage) => {
    sessionStorage.setItem(PENDING_KEY, pkg.id)
    setAuthModal(true)
  }

  const buyPackage = (pkg: ShopPackage) => {
    if (isGuest) {
      requireAccount(pkg)
      return
    }
    selectPackage(pkg)
  }

  const confirmPurchase = () => {
    if (isGuest) {
      requireAccount(selected ?? packages[0])
      return
    }
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
    { id: 'ranking', label: 'Ranking' },
  ]

  return (
    <div className="dash">
      <header className="topbar">
        <button className="logo" onClick={() => goTo('inicio')}>
          <span className="logo-mark" aria-hidden="true">
            <svg className="logo-diamond" viewBox="0 0 32 32">
              <defs>
                <linearGradient id="diamond-grad" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#b3ecff" />
                  <stop offset="0.45" stopColor="#00d4ff" />
                  <stop offset="1" stopColor="#006fae" />
                </linearGradient>
                <linearGradient id="diamond-shine" x1="10" y1="5" x2="24" y2="14" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
                  <stop offset="1" stopColor="#c9f4ff" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              <path
                d="M10 4h12l8 10-14 14L2 14l8-10Z"
                fill="url(#diamond-grad)"
              />
              <path d="M11 10 16 4l5 6-5 4-5-6Z" fill="url(#diamond-shine)" />
              <path
                d="M2 14h28M16 4v24M10 4l1 6M22 4l-1 6M11 10l5 4 5-4M2 14l5 4M30 14l-5 4M7 18l9 10M25 18l-9 10"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="0.9"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
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
                    <span className="pay">PayPal</span>
                    <span className="pay">SpingByOxxo</span>
                    <span className="pay">Binance</span>
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
                      onClick={() => buyPackage(pkg)}
                    >
                      {pkg.popular && <div className="badge">POPULAR</div>}
                      <img
                        className="package-img"
                        src={`/images/${pkg.diamonds}.png`}
                        alt={`${pkg.diamonds} diamantes`}
                      />
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

            <section className="section-card pass-banner">
              <img
                className="pass-img"
                src="/images/paseElite.png"
                alt="Pase Elite"
              />
              <div className="pass-info">
                <div className="eyebrow">OFERTA ESPECIAL</div>
                <h2>Pase Elite</h2>
                <p>
                  Pase de temporada con entrega inmediata y beneficios exclusivos.
                </p>
                <strong className="pass-price">{money(featuredPass.price)}</strong>
              </div>
              <button className="buy" onClick={() => buyPackage(featuredPass)}>
                Comprar
              </button>
            </section>

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
                    <img
                      className="package-img big"
                      src={`/images/${pkg.diamonds}.png`}
                      alt={`${pkg.diamonds} diamantes`}
                    />
                    <div>
                      <h3>{pkg.diamonds} ◆</h3>
                      <p>
                        {pkg.diamonds - pkg.bonus} + {pkg.bonus} bonus
                      </p>
                      <strong className="product-price">{money(pkg.price)}</strong>
                      <button className="buy" onClick={() => buyPackage(pkg)}>
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
                  <strong>{selected ? money(selected.price) : money(0)}</strong>
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
                    <button className="buy" onClick={() => buyPackage(pkg)}>
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

      {authModal && (
        <div className="auth-modal">
          <div className="auth-modal-card">
            <button
              className="auth-modal-close"
              onClick={() => setAuthModal(false)}
            >
              ×
            </button>
            <span className="auth-modal-icon">◆</span>
            <h3>Necesitas una cuenta para comprar</h3>
            <p>
              Inicia sesion o registrate para completar tu compra de diamantes.
              Guardaremos el paquete que elegiste.
            </p>
            <button className="buy wide" onClick={logout}>
              Iniciar sesion
            </button>
            <button className="buy wide ghost" onClick={logout}>
              Registrarse
            </button>
            <button
              className="auth-modal-link"
              onClick={() => setAuthModal(false)}
            >
              Seguir viendo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}