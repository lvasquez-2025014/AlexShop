import { useEffect, useRef, useState } from 'react'
import { GUEST_EMAIL, useAuth } from '../auth/AuthContext'
import gsap from 'gsap'
import {
  packages,
  passes,
  featuredPass,
  maxeoProducts,
  maxeoLevels,
  type ShopPackage,
  type MaxeoProduct,
} from '../data/mockData'

type StoreItem = ShopPackage | MaxeoProduct

function Letters({ text, className = '' }: { text: string; className?: string }) {
  return (
    <span className={className}>
      {text.split('').map((letter, index) => (
        <span className="hl" key={`${letter}-${index}`}>
          {letter}
        </span>
      ))}
    </span>
  )
}
import './Dashboard.css'

type Page = 'inicio' | 'diamantes' | 'pases'

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
  const { user, logout, updateProfile } = useAuth()
  const isGuest = user?.email === GUEST_EMAIL
  const pageRef = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState<Page>('inicio')
  const [menuOpen, setMenuOpen] = useState(false)
  const [selected, setSelected] = useState<StoreItem | null>(null)
  const [playerId, setPlayerId] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [currency, setCurrency] = useState('MXN')
  const [currencyOpen, setCurrencyOpen] = useState(false)
  const [authModal, setAuthModal] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [ffName, setFfName] = useState(user?.ffName ?? '')
  const [ffId, setFfId] = useState(user?.ffId ?? '')
  const [profileSaving, setProfileSaving] = useState(false)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      tl.from('.page.active .eyebrow', {
        letterSpacing: '16px',
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        clearProps: 'all',
      })
        .from('.page.active h1', {
          y: 34,
          opacity: 0,
          duration: 0.75,
          clearProps: 'all',
        }, '-=0.35')
        .from('.page.active h2', {
          y: 24,
          rotation: -1.5,
          opacity: 0,
          duration: 0.55,
          stagger: 0.1,
          clearProps: 'all',
        }, '-=0.35')
        .from('.page.active .intro-copy, .page.active .sub-hero p, .page.active .pass-info p', {
          y: 20,
          opacity: 0,
          filter: 'blur(6px)',
          duration: 0.6,
          stagger: 0.08,
          clearProps: 'all',
        }, '-=0.35')
        .from('.page.active .payment-box', {
          scale: 0.92,
          y: 14,
          opacity: 0,
          duration: 0.55,
          clearProps: 'all',
        }, '-=0.3')
        .from('.page.active .section-card', {
          y: 36,
          opacity: 0,
          duration: 0.7,
          stagger: 0.12,
          clearProps: 'all',
        }, '-=0.45')
        .from('.page.active .maxeo-row', {
          scale: 0.92,
          opacity: 0,
          duration: 0.4,
          stagger: 0.06,
          clearProps: 'all',
        }, '-=0.5')
        .from('.page.active .maxeo-tag', {
          scale: 0.8,
          opacity: 0,
          duration: 0.45,
          stagger: 0.08,
          clearProps: 'all',
        }, '-=0.2')
        .from('.page.active .fame-head', {
          scale: 0.92,
          opacity: 0,
          duration: 0.5,
          clearProps: 'all',
        }, '-=0.4')
        .add(() => {
          const isMobile = window.matchMedia('(max-width: 800px)').matches

          const steps = gsap.utils.toArray<HTMLElement>('.page.active .step')
          steps.forEach((el, i) => {
            tl.from(el, {
              x: i % 2 === 0 ? -28 : 28,
              opacity: 0,
              duration: 0.45,
              clearProps: 'all',
            }, '<')
          })

          if (isMobile) return

          const letters = gsap.utils.toArray<HTMLElement>('.page.active .hl')
          const wave = gsap.timeline({ repeat: -1, repeatDelay: 3.5, delay: 0.4 })
          letters.forEach((letter) => {
            wave
              .to(letter, { y: -13, duration: 0.18, ease: 'sine.inOut' })
              .to(letter, { y: 0, duration: 0.18, ease: 'sine.inOut' })
          })

          const nums = gsap.utils.toArray<HTMLElement>(
            '.page.active .amount, .page.active .price, .page.active .pass-price, .page.active .product-price, .page.active .total strong, .page.active .maxeo-row strong'
          )
          nums.forEach((el) => {
            const text = el.textContent ?? ''
            const match = text.match(/[\d,]+(?:\.\d+)?/)
            if (!match || match.index === undefined) return
            const target = parseFloat(match[0].replace(/,/g, ''))
            const prefix = text.slice(0, match.index)
            const suffix = text.slice(match.index + match[0].length)
            const state = { v: 0 }
            gsap.to(state, {
              v: target,
              duration: 1,
              ease: 'power2.out',
              onUpdate: () => {
                const decimals = Number.isInteger(target) ? 0 : 2
                el.textContent =
                  prefix +
                  state.v.toLocaleString('en-US', {
                    minimumFractionDigits: decimals,
                    maximumFractionDigits: 2,
                  }) +
                  suffix
              },
            })
          })

          gsap.to('.page.active .eyebrow', {
            letterSpacing: '4.8px',
            opacity: 0.85,
            duration: 1.4,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
            delay: 1.8,
          })

          gsap.fromTo('.page.active .fame-head', {
            textShadow: '0 0 8px rgba(0, 212, 255, 0.12)',
          }, {
            textShadow: '0 0 24px rgba(0, 212, 255, 0.5)',
            duration: 1.5,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut',
            delay: 1.4,
          })

          gsap.to('.page.active .package-img, .page.active .pass-img, .page.active .maxeo-img', {
            y: -7,
            duration: 1.7,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut',
            stagger: 0.25,
            delay: 1.3,
          })
        })
    }, pageRef)

    return () => ctx.revert()
  }, [page])

  const itemLabel = (item: StoreItem) =>
    'label' in item ? item.label : `${item.diamonds} ◆`

  useEffect(() => {
    const onClick = () => {
      setProfileOpen(false)
      setCurrencyOpen(false)
    }
    window.addEventListener('click', onClick)
    return () => window.removeEventListener('click', onClick)
  }, [])

  useEffect(() => {
    const raw = sessionStorage.getItem(PENDING_KEY)
    if (raw && !isGuest) {
      sessionStorage.removeItem(PENDING_KEY)
      try {
        const item = JSON.parse(raw) as StoreItem
        setSelected(item)
        setPage('diamantes')
        setToast(`Bienvenido! Tu compra de ${itemLabel(item)} esta lista`)
        window.setTimeout(() => setToast(null), 2600)
      } catch {
        // valor antiguo o corrupto: ignorar
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const money = (n: number) => {
    const { rate, symbol } = currencyConfig[currency]
    const value = n * rate
    const decimals = Number.isInteger(value) ? (currency === 'USD' ? 2 : 0) : 2
    return symbol + value.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }

  const showToast = (text: string) => {
    setToast(text)
    window.setTimeout(() => setToast(null), 2400)
  }

  const requireAccount = (item: StoreItem) => {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(item))
    setAuthModal(true)
  }

  const buyItem = (item: StoreItem) => {
    if (isGuest) {
      requireAccount(item)
      return
    }
    setSelected(item)
    if (page !== 'diamantes') {
      setPage('diamantes')
    }
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
  ]

  return (
    <div className="dash" ref={pageRef}>
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
          <div className="profile-wrap">
            <button
              className="user-chip"
              onClick={(e) => {
                e.stopPropagation()
                setProfileOpen(!profileOpen)
                setFfName(user?.ffName ?? '')
                setFfId(user?.ffId ?? '')
              }}
            >
              {user?.picture ? (
                <img className="user-avatar" src={user.picture} alt={user.name} referrerPolicy="no-referrer" />
              ) : (
                <span className="user-avatar-placeholder">{user?.name?.charAt(0) ?? '?'}</span>
              )}
              <span className="user-name">{user?.name}</span>
              <span className="user-caret">⌄</span>
            </button>

            {profileOpen && (
              <div className="profile-dropdown" onClick={(e) => e.stopPropagation()}>
                <div className="profile-head">
                  <img className="profile-photo" src={user?.picture} alt={user?.name} referrerPolicy="no-referrer" />
                  <div>
                    <strong>{user?.name}</strong>
                    <span>{user?.email}</span>
                  </div>
                </div>

                <div className="profile-section">
                  <span className="profile-label">CUENTA FREE FIRE</span>
                  <label className="profile-field">
                    <span>Nombre de la cuenta</span>
                    <input
                      value={ffName}
                      onChange={(e) => setFfName(e.target.value)}
                      placeholder="Ej: AlexElPro"
                    />
                  </label>
                  <label className="profile-field">
                    <span>ID de la cuenta</span>
                    <input
                      value={ffId}
                      onChange={(e) => setFfId(e.target.value)}
                      placeholder="Ej: 123456789"
                    />
                  </label>
                  <button
                    className="profile-save"
                    disabled={profileSaving}
                    onClick={async () => {
                      setProfileSaving(true)
                      try {
                        await updateProfile({ ffName, ffId })
                        showToast('Perfil guardado')
                        setProfileOpen(false)
                      } catch (err) {
                        showToast(err instanceof Error ? err.message : 'Error al guardar')
                      } finally {
                        setProfileSaving(false)
                      }
                    }}
                  >
                    {profileSaving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>

                <button className="profile-logout" onClick={logout}>
                  Cerrar sesion
                </button>
              </div>
            )}
          </div>
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
                  <Letters text="Free" />
                  <br />
                  <Letters text="Fire" />
                  <br />
                  <Letters text="Recarga" className="grad" />
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
                      onClick={() => buyItem(pkg)}
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
                <button className="buy" onClick={() => buyItem(featuredPass)}>
                  Comprar
                </button>
              </section>

              <section className="section-card maxeo-card">
                <div className="maxeo-head">
                  <img
                    className="maxeo-img"
                    src="/images/evos.png"
                    alt="Armas evolutivas"
                  />
                  <div>
                    <div className="eyebrow">ENTREGA APROXIMADA (24-30H)</div>
                    <h2>Maxeos de armas evolutivas</h2>
                  </div>
                </div>
                <div className="maxeo-grid">
                  {maxeoLevels.map((level) => (
                    <button
                      key={level.id}
                      className="maxeo-row"
                      onClick={() => buyItem(level)}
                    >
                      <span>{level.label.replace(/^Maxeo /, '')}</span>
                      <strong>{money(level.price)}</strong>
                    </button>
                  ))}
                </div>
                <div className="maxeo-extra">
                  {maxeoProducts.map((item) => (
                    <button
                      key={item.id}
                      className={`maxeo-tag ${item.id === 'cajas99' ? 'highlight' : ''}`}
                      onClick={() => buyItem(item)}
                    >
                      {item.label.toUpperCase()} {money(item.price)} {item.id === 'frag' || item.id === 'cajas' ? 'c/u' : '—'}
                      ☠️
                    </button>
                  ))}
                </div>
              </section>
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
                  <Letters text="Compra tus" /> <Letters text="diamantes" className="grad" />
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
                      <button className="buy" onClick={() => buyItem(pkg)}>
                        Comprar
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <aside className="checkout-panel">
                <h3>Datos de entrega</h3>
                <div className={`checkout-item ${selected ? '' : 'empty'}`}>
                  {selected ? itemLabel(selected) : 'Ningun producto seleccionado'}
                </div>
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
                  <Letters text="Pases al" /> <Letters text="mejor precio" className="grad" />
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
                    <button className="buy" onClick={() => buyItem(pkg)}>
                      Comprar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <span>© 2026 AlexShop </span>
        <span>PRIVACIDAD · TERMINOS · SOPORTE</span>
      </footer>

      {page !== 'inicio' && (
        <button className="back-btn" onClick={() => goTo('inicio')} aria-label="Volver">
          ←
        </button>
      )}

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