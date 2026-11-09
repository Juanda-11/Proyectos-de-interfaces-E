import { useEffect, useRef, useState } from 'react'
import { LogIn, LogOut, UserRound } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { useI18n } from '../i18n/I18nProvider'

/** Iniciales para el avatar: primera letra de las dos primeras palabras del nombre. */
export const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || '?'

/** Cuenta activa en la barra superior: nombre, correo y cierre de sesión (o acceso, si se trabaja sin cuenta). */
export default function UserMenu() {
  const { t } = useI18n()
  const { status, user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const root = useRef(null)

  useEffect(() => {
    if (!open) return
    const outside = (e) => !root.current?.contains(e.target) && setOpen(false)
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  if (status === 'local') {
    return (
      <button
        onClick={logout}
        className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm border border-line text-slate-300 hover:bg-white/5 transition"
      >
        <LogIn size={15} /> {t('auth.signIn')}
      </button>
    )
  }
  if (status !== 'authenticated' || !user) return null

  return (
    <div ref={root} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('auth.userMenu', { name: user.name })}
        title={user.name}
        className="flex items-center gap-2 h-8 pl-1 pr-2 rounded-full border border-line hover:bg-white/5 transition"
      >
        <span className="grid place-items-center w-6 h-6 rounded-full bg-water text-[11px] font-semibold text-white">
          {initials(user.name)}
        </span>
        <span className="hidden xl:inline max-w-[8rem] truncate text-xs text-slate-300">
          {user.name}
        </span>
      </button>
      {open && (
        <div
          role="menu"
          className="rise absolute right-0 mt-1.5 w-64 p-1 rounded-xl bg-panel border border-line shadow-xl z-40"
        >
          <div className="px-3 py-2.5 border-b border-line mb-1" role="none">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-100">
              <UserRound size={14} className="text-sky-400 shrink-0" />
              <span className="truncate">{user.name}</span>
            </div>
            <div className="mt-0.5 text-xs text-slate-400 truncate">{user.email}</div>
          </div>
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false)
              logout()
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-white/10 text-left"
          >
            <LogOut size={15} className="text-sky-400" /> {t('auth.signOut')}
          </button>
        </div>
      )}
    </div>
  )
}
