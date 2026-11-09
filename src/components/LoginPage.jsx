import { useRef, useState } from 'react'
import {
  AlertTriangle,
  Droplets,
  Eye,
  EyeOff,
  Info,
  Loader2,
  Mail,
  LockKeyhole,
  UserRound,
  Sparkles,
  Waves,
  FileDown,
  WifiOff,
} from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { passwordStrength, validateAuthForm } from '../auth/validation'
import { useI18n } from '../i18n/I18nProvider'
import { useTheme } from '../hooks/useTheme'
import Preferences from './Preferences'

const INPUT =
  'w-full h-11 pl-10 pr-3 rounded-xl bg-app border text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30'
const STRENGTH_COLOR = ['bg-red-400', 'bg-red-400', 'bg-amber-400', 'bg-emerald-400']

function Field({ id, label, icon: Icon, error, children, trailing }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-slate-300 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <Icon
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
        />
        {children}
        {trailing}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}

/** Pantalla de acceso: inicio de sesión, registro, cuenta de demostración y modo local. */
export default function LoginPage() {
  const { t } = useI18n()
  const auth = useAuth()
  const { theme, toggle } = useTheme()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const formRef = useRef(null)

  const canRegister = auth.server?.registration === true
  const registering = mode === 'register' && canRegister
  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setErrors((errs) => ({ ...errs, [field]: undefined }))
    setFormError('')
  }

  const run = async (action) => {
    setBusy(true)
    setFormError('')
    try {
      await action()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const submit = (e) => {
    e.preventDefault()
    if (busy) return
    const next = validateAuthForm(registering ? 'register' : 'login', form)
    setErrors(next)
    if (Object.keys(next).length) {
      formRef.current?.querySelector('[aria-invalid="true"], input')?.focus?.()
      return
    }
    run(() =>
      registering
        ? auth.register(form.name.trim(), form.email.trim(), form.password)
        : auth.login(form.email.trim(), form.password),
    )
  }

  const demo = auth.server?.demo
  const strength = passwordStrength(form.password)
  const features = [
    [Waves, 'auth.brand.f1'],
    [Sparkles, 'auth.brand.f2'],
    [FileDown, 'auth.brand.f3'],
  ]

  return (
    <div className="h-full overflow-y-auto bg-app">
      <div className="min-h-full grid lg:grid-cols-[1.05fr_1fr]">
        {/* Panel de marca */}
        <aside className="hidden lg:flex relative overflow-hidden flex-col justify-between p-12 bg-water text-white">
          <svg
            className="absolute inset-0 w-full h-full opacity-[.18]"
            aria-hidden="true"
            preserveAspectRatio="xMidYMid slice"
            viewBox="0 0 600 800"
          >
            {[160, 300, 440, 580].map((y, i) => (
              <g key={y}>
                <path
                  d={`M-20 ${y} H${200 + i * 60} V${y + 90} H640`}
                  fill="none"
                  stroke="#fff"
                  strokeOpacity=".5"
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  className="flow"
                  d={`M-20 ${y} H${200 + i * 60} V${y + 90} H640`}
                  fill="none"
                  stroke="#fff"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="2 22"
                />
              </g>
            ))}
          </svg>
          <div className="relative flex items-center gap-3">
            <span className="grid place-items-center w-11 h-11 rounded-2xl bg-white/20 backdrop-blur">
              <Droplets size={24} />
            </span>
            <span className="text-xl font-semibold">HydroGraph AI</span>
          </div>
          <div className="relative max-w-md space-y-8">
            <h2 className="text-4xl font-semibold leading-tight">{t('auth.brand.tagline')}</h2>
            <ul className="space-y-4">
              {features.map(([Icon, key]) => (
                <li key={key} className="flex items-center gap-3 text-white/90">
                  <span className="grid place-items-center w-9 h-9 rounded-xl bg-white/15 shrink-0">
                    <Icon size={18} />
                  </span>
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>
          <p className="relative text-xs text-white/70">© 2026 HydroGraph AI</p>
        </aside>

        {/* Formulario */}
        <main className="relative flex flex-col items-center justify-center px-6 py-10">
          <div className="absolute top-4 right-4">
            <Preferences theme={theme} onToggleTheme={toggle} />
          </div>
          <div className="w-full max-w-sm">
            <div className="lg:hidden flex items-center gap-2.5 mb-8">
              <span className="grid place-items-center w-9 h-9 rounded-xl bg-water">
                <Droplets size={18} className="text-white" />
              </span>
              <span className="text-lg font-semibold text-slate-100">HydroGraph AI</span>
            </div>

            <h1 className="text-2xl font-semibold text-slate-100">
              {registering ? t('auth.title.register') : t('auth.title.login')}
            </h1>
            <p className="mt-1.5 text-sm text-slate-400">
              {registering ? t('auth.subtitle.register') : t('auth.subtitle.login')}
            </p>

            {canRegister && (
              <div
                role="tablist"
                aria-label={t('auth.tabs')}
                className="mt-6 grid grid-cols-2 p-1 rounded-xl bg-panel border border-line"
              >
                {[
                  ['login', t('auth.signIn')],
                  ['register', t('auth.createAccount')],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    role="tab"
                    type="button"
                    aria-selected={mode === id}
                    onClick={() => {
                      setMode(id)
                      setErrors({})
                      setFormError('')
                    }}
                    className={`h-9 rounded-lg text-sm font-medium transition ${mode === id ? 'bg-water text-white shadow' : 'text-slate-300 hover:bg-white/5'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {auth.expired && <Notice icon={Info} tone="sky" text={t('auth.expired')} />}
            {!auth.reachable && (
              <div
                className="mt-5 p-3.5 rounded-xl border border-amber-400/40 bg-amber-400/10 text-sm text-amber-300 space-y-3"
                role="alert"
              >
                <p className="flex gap-2">
                  <WifiOff size={16} className="shrink-0 mt-0.5" /> {t('auth.offline')}
                </p>
                <button
                  type="button"
                  onClick={auth.retry}
                  className="h-8 px-3 rounded-lg border border-amber-400/40 text-xs font-medium hover:bg-amber-400/10 transition"
                >
                  {t('auth.retry')}
                </button>
              </div>
            )}
            {auth.reachable && auth.server && !canRegister && (
              <Notice icon={Info} tone="sky" text={t('auth.registrationOff')} muted />
            )}

            <form ref={formRef} onSubmit={submit} noValidate className="mt-6 space-y-4">
              {registering && (
                <Field id="auth-name" label={t('auth.name')} icon={UserRound} error={errors.name}>
                  <input
                    id="auth-name"
                    value={form.name}
                    onChange={set('name')}
                    autoComplete="name"
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? 'auth-name-error' : undefined}
                    className={`${INPUT} ${errors.name ? 'border-red-400' : 'border-line'}`}
                  />
                </Field>
              )}
              <Field id="auth-email" label={t('auth.email')} icon={Mail} error={errors.email}>
                <input
                  id="auth-email"
                  type="email"
                  inputMode="email"
                  value={form.email}
                  onChange={set('email')}
                  autoComplete="email"
                  placeholder="nombre@correo.com"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'auth-email-error' : undefined}
                  className={`${INPUT} ${errors.email ? 'border-red-400' : 'border-line'}`}
                />
              </Field>
              <Field
                id="auth-password"
                label={t('auth.password')}
                icon={LockKeyhole}
                error={errors.password}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 grid place-items-center rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/10"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              >
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  autoComplete={registering ? 'new-password' : 'current-password'}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'auth-password-error' : undefined}
                  className={`${INPUT} pr-11 ${errors.password ? 'border-red-400' : 'border-line'}`}
                />
              </Field>
              {registering && (
                <div aria-live="polite">
                  <div className="flex gap-1" aria-hidden="true">
                    {[1, 2, 3].map((n) => (
                      <i
                        key={n}
                        className={`h-1 flex-1 rounded-full transition ${form.password && strength >= n ? STRENGTH_COLOR[strength] : 'bg-line'}`}
                      />
                    ))}
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">
                    {t('auth.passwordHint')}{' '}
                    {form.password && (
                      <strong className="font-medium text-slate-300">
                        {t(`auth.strength.${strength}`)}
                      </strong>
                    )}
                  </p>
                </div>
              )}

              {formError && (
                <p
                  role="alert"
                  className="flex gap-2 p-3 rounded-xl border border-red-400/40 bg-red-500/10 text-sm text-red-300"
                >
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" /> {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-water text-sm font-medium text-white shadow-[0_0_18px_rgba(14,165,233,.35)] hover:brightness-110 active:scale-[.99] disabled:opacity-70 transition"
              >
                {busy && <Loader2 size={16} className="animate-spin" />}
                {busy
                  ? t('auth.working')
                  : registering
                    ? t('auth.submit.register')
                    : t('auth.submit.login')}
              </button>
            </form>

            {(demo || !auth.reachable) && (
              <div className="mt-5 space-y-3">
                <div className="flex items-center gap-3 text-xs text-slate-500" aria-hidden="true">
                  <i className="h-px flex-1 bg-line" /> {t('auth.or')}{' '}
                  <i className="h-px flex-1 bg-line" />
                </div>
                {demo && (
                  <>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run(() => auth.login(demo.email, demo.password))}
                      className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-violet-400/40 text-sm font-medium text-violet-200 hover:bg-violet-500/15 disabled:opacity-60 transition"
                    >
                      <Sparkles size={16} /> {t('auth.demo')}
                    </button>
                    <p className="text-center text-xs text-slate-500">{t('auth.demoHint', demo)}</p>
                  </>
                )}
                {!auth.reachable && (
                  <button
                    type="button"
                    onClick={auth.enterLocal}
                    className="w-full h-11 rounded-xl border border-line text-sm font-medium text-slate-200 hover:bg-white/5 transition"
                  >
                    {t('auth.local')}
                  </button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

function Notice({ icon: Icon, text, muted }) {
  return (
    <p
      className={`mt-5 flex gap-2 p-3 rounded-xl border text-sm ${muted ? 'border-line text-slate-400' : 'border-sky-400/30 bg-sky-500/10 text-sky-300'}`}
      role="status"
    >
      <Icon size={16} className="shrink-0 mt-0.5" /> {text}
    </p>
  )
}
