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
            [key: string]: unknown
          }) => void
          renderButton: (element: HTMLElement, config: Record<string, unknown>) => void
          prompt: () => void
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
const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? ''
let googleInitialized = false

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
    if (!GOOGLE_CLIENT_ID) {
      console.warn('VITE_GOOGLE_CLIENT_ID no configurado; Google Sign-In deshabilitado')
      return
    }
    let cancelled = false
    const poll = setInterval(() => {
      if (cancelled) return
      if (!window.google?.accounts?.id || !googleBtnRef.current) return
      clearInterval(poll)

      if (!googleInitialized) {
        googleInitialized = true
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            handleGoogle(response.credential)
          },
          // Deshabilita el auto-select para que el popup se abra
          // solo cuando el usuario hace click, no automáticamente al cargar.
          auto_select: false,
          cancel_on_tap_outside: true,
          // Habilita el flujo de popup nativo (más confiable que el click programático).
          itp_support: true,
          use_fedcm_for_prompt: true,
        })

        // Render Google's official button off-screen so we can trigger it
        // programmatically from our custom button. Position it far outside
        // the viewport so the cursor never hovers over it (avoiding the
        // pointer cursor leak).
        googleBtnRef.current.innerHTML = ''
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: 300,
        })
      }
    }, 200)

    return () => { cancelled = true; clearInterval(poll) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * Estrategia robusta para abrir el popup de Google con múltiples fallbacks:
   * 1. Espera activa hasta que GIS esté listo (hasta 2s).
   * 2. Si el botón off-screen está renderizado, intenta hacer click.
   * 3. Si falla el click, usa `prompt()` (popup nativo de GIS).
   * 4. Como último recurso, muestra un error claro al usuario.
   */
  const handleCustomGoogleClick = (e?: React.MouseEvent) => {
    e?.preventDefault()
    if (!GOOGLE_CLIENT_ID) {
      console.error('Google Client ID no configurado')
      return
    }

    // Si GIS aún no está listo, esperar hasta 2s y reintentar.
    if (!window.google?.accounts?.id) {
      console.warn('Google Identity Services aún no está listo, esperando...')
      let waited = 0
      const waitInterval = setInterval(() => {
        waited += 200
        if (window.google?.accounts?.id || waited >= 2000) {
          clearInterval(waitInterval)
          if (window.google?.accounts?.id) {
            // Reintentar después de que cargó GIS
            triggerGoogleLogin()
          } else {
            console.error('Google Identity Services no cargó. Recarga la página.')
          }
        }
      }, 200)
      return
    }

    triggerGoogleLogin()
  }

  /**
   * Ejecuta el flujo de login con Google. Se llama solo cuando GIS está listo.
   */
  const triggerGoogleLogin = () => {
    // Estrategia 1: Click en el botón off-screen.
    const host = googleBtnRef.current
    if (host) {
      // Re-renderizar el botón si aún no existe (caso: usuario clickeó muy rápido).
      if (host.children.length === 0 && window.google?.accounts?.id?.renderButton) {
        try {
          window.google.accounts.id.renderButton(host, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: 300,
          })
        } catch (e) {
          console.warn('Re-render del botón falló:', e)
        }
      }

      // Buscar el botón interno (múltiples selectores para compatibilidad).
      const inner = host.querySelector<HTMLElement>(
        'div[role="button"], iframe, .nCP5dc, [id^="gsi_"], button'
      )
      if (inner) {
        try {
          inner.click()
          return
        } catch (err) {
          console.warn('Click al botón off-screen falló, usando prompt()', err)
        }
      }
    }

    // Estrategia 2: Popup nativo de Google (prompt).
    if (window.google?.accounts?.id?.prompt) {
      try {
        window.google.accounts.id.prompt()
        return
      } catch (err) {
        console.error('Google prompt() falló:', err)
      }
    }

    // Estrategia 3: Como último recurso, abrir el selector de Google en nueva ventana.
    console.error('No se pudo abrir el popup de Google. Recarga la página.')
    setError('No se pudo abrir el inicio de sesión con Google. Por favor recarga la página.')
  }

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
        <img
          src="/images/logo.png"
          alt="AlexShop logo"
          className="login-logo"
        />
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
                placeholder=""
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

        <button
          type="button"
          className="google-custom-btn"
          onClick={handleCustomGoogleClick}
          disabled={!GOOGLE_CLIENT_ID}
        >
          <svg className="google-logo" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
            <path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" />
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
          </svg>
          <span>Continuar con Google</span>
        </button>

        {/* Off-screen Google button: Google renders its official button here.
            Positioned far outside the viewport so our custom cursor never
            hovers over it (avoiding pointer cursor leak). */}
        <div ref={googleBtnRef} className="google-native-host" aria-hidden="true" />

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