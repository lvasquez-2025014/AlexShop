import { useState, useEffect, useRef, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'
import gsap from 'gsap'
import './Login.css'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
          }) => void
          renderButton: (element: HTMLElement, config: Record<string, unknown>) => void
        }
      }
    }
  }
}

type Feature = {
  icon: 'diamond' | 'bolt' | 'users' | 'shield' | 'support'
  title: string
  subtitle: string
}

type Slide = {
  tagline: string
  sub: string
  features: Feature[]
}

const slides: Slide[] = [
  {
    tagline: 'Tu mejor opcion',
    sub: 'Lideres en venta de diamantes',
    features: [
      { icon: 'diamond', title: 'Precios -40%', subtitle: 'Valor Original' },
      { icon: 'bolt', title: 'Pases Elite', subtitle: 'Al mejor precio' },
      { icon: 'users', title: '+15', subtitle: 'Clientes Activos' },
    ],
  },
  {
    tagline: 'Entrega inmediata',
    sub: 'Recibe tus diamantes en minutos',
    features: [
      { icon: 'bolt', title: 'Entrega Rapida', subtitle: 'En un plazo de 0 a 24 H' },
      { icon: 'shield', title: 'Compra Segura', subtitle: '100% garantizada' },
      { icon: 'support', title: 'Soporte 24/7', subtitle: 'Siempre disponibles' },
    ],
  },
  {
    tagline: 'La tienda #1',
    sub: 'La mas confiable de la comunidad',
    features: [
      { icon: 'diamond', title: 'Precios -40%', subtitle: 'Del precio original' },
      { icon: 'shield', title: 'Metodos Seguros', subtitle: 'Pagos protegidos' },
      { icon: 'users', title: '+15', subtitle: 'Clientes satisfechos' },
    ],
  },
]

function FeatureIcon({ icon }: { icon: Feature['icon'] }) {
  if (icon === 'diamond') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 3h12l4 6-10 13L2 9l4-6Z" />
        <path d="M11 3 8 9l4 13 4-13-3-6" />
      </svg>
    )
  }
  if (icon === 'bolt') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />
      </svg>
    )
  }
  if (icon === 'shield') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z" />
      </svg>
    )
  }
  if (icon === 'support') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Z" />
        <path d="M21 11h-3a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-5Z" />
        <path d="M3 11a9 9 0 0 1 18 0" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

const brandLetters = 'AlexShop'.split('')

const iconClassMap: Record<Feature['icon'], string> = {
  diamond: 'icon-diamond',
  bolt: 'icon-bolt',
  users: 'icon-users',
  shield: 'icon-shield',
  support: 'icon-support',
}

export default function Login() {
  const { login, loginWithGoogle, loginAsGuest } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [slideIndex, setSlideIndex] = useState(0)

  const brandRef = useRef<HTMLHeadingElement>(null)
  const taglineRef = useRef<HTMLParagraphElement>(null)
  const subRef = useRef<HTMLParagraphElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const googleBtnRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      tl.from(brandRef.current, {
        x: -80,
        opacity: 0,
        duration: 0.8,
      })
        .from(taglineRef.current, {
          x: -60,
          opacity: 0,
          duration: 0.7,
        }, '-=0.4')
        .from(subRef.current, {
          x: -50,
          opacity: 0,
          duration: 0.6,
        }, '-=0.3')
        .from('.feature-card', {
          x: -60,
          opacity: 0,
          duration: 0.6,
          stagger: 0.15,
        }, '-=0.2')
        .add(() => {
          const letters = gsap.utils.toArray<HTMLElement>('.brand-letter')
          const wave = gsap.timeline({ repeat: -1, repeatDelay: 4 })
          letters.forEach((letter) => {
            wave
              .to(letter, { y: -20, duration: 0.25, ease: 'sine.inOut' })
              .to(letter, { y: 0, duration: 0.25, ease: 'sine.inOut' })
          })
        })
    })

    return () => ctx.revert()
  }, [])

  useEffect(() => {
    let cancelled = false
    const poll = setInterval(() => {
      if (cancelled) return
      if (!window.google?.accounts?.id || !googleBtnRef.current) return
      clearInterval(poll)

      window.google.accounts.id.initialize({
        client_id: '613074658722-fc60ijusjt5ntk39c9ai2gn98lt6t61q.apps.googleusercontent.com',
        callback: (response) => {
          handleGoogle(response.credential)
        },
      })

      googleBtnRef.current.innerHTML = ''
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'outline',
        size: 'large',
        width: 360,
        text: 'continue_with',
        shape: 'pill',
        logo_alignment: 'left',
      })
    }, 200)

    return () => { cancelled = true; clearInterval(poll) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const targets: gsap.TweenTarget[] = [taglineRef.current, subRef.current]
    targets.push(...(featuresRef.current?.querySelectorAll('.feature-text') ?? []))
    gsap.fromTo(
      targets,
      { x: 40, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.5, ease: 'power2.out', stagger: 0.08 }
    )
  }, [slideIndex])

  useEffect(() => {
    const interval = setInterval(() => {
      const targets: gsap.TweenTarget[] = [taglineRef.current, subRef.current]
      targets.push(...(featuresRef.current?.querySelectorAll('.feature-text') ?? []))
      gsap.to(targets, {
        x: -40,
        opacity: 0,
        duration: 0.35,
        ease: 'power2.in',
        stagger: 0.05,
        onComplete: () => {
          setSlideIndex((prev) => (prev + 1) % slides.length)
        },
      })
    }, 3500)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesion')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async (credential: string) => {
    setError(null)
    setLoading(true)
    try {
      await loginWithGoogle(credential)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al autenticar con Google')
    } finally {
      setLoading(false)
    }
  }

  const slide = slides[slideIndex]!

  return (
    <main className="login">
      <video className="login-video" autoPlay muted loop playsInline>
        <source src="/videos/animacion.mp4" type="video/mp4" />
      </video>

      <section className="login-left">
        <h1 className="login-brand" ref={brandRef}>
          {brandLetters.map((letter, index) => (
            <span className="brand-letter" key={`${letter}-${index}`}>
              {letter}
            </span>
          ))}
        </h1>
        <p className="login-tagline" ref={taglineRef}>{slide.tagline}</p>
        <p className="login-sub" ref={subRef}>{slide.sub}</p>

        <div className="login-features" ref={featuresRef}>
          {slide.features.map((feature) => (
            <div className="feature-card" key={feature.title}>
              <span className={`feature-icon ${iconClassMap[feature.icon]}`}>
                <FeatureIcon icon={feature.icon} />
              </span>
              <div className="feature-text">
                <strong>{feature.title}</strong>
                <span>{feature.subtitle}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="login-right">
        <h2>Iniciar Sesion</h2>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-field-group">
            <span className="field-label">ADMIN / USUARIO</span>
            <label className="login-field">
              <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@alexshop.com"
                autoComplete="email"
                required
              />
            </label>
          </div>

          <div className="login-field-group">
            <span className="field-label">CONTRASENA</span>
            <label className="login-field">
              <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimo 6 caracteres"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="field-eye"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <line x1="2" y1="2" x2="22" y2="22" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </label>
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Ingresando...' : 'INICIAR SESION'}
          </button>
        </form>

        <div className="login-divider">
          <span>ACCESO RAPIDO</span>
        </div>

        <div ref={googleBtnRef} className="google-btn-container" />

        <hr className="login-separator" />

        <button type="button" className="login-guest" onClick={loginAsGuest}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Continuar sin cuenta
        </button>

        <p className="login-footer-text">CONTACTO Y SOPORTE</p>
      </section>
    </main>
  )
}