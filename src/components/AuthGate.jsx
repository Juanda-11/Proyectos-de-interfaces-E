import { Droplets, Loader2 } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { useI18n } from '../i18n/I18nProvider'
import LoginPage from './LoginPage'

/** Muestra la aplicación solo con sesión iniciada (o en modo abierto o local); si no, la pantalla de acceso. */
export default function AuthGate({ children }) {
  const { t } = useI18n()
  const { status } = useAuth()
  if (status === 'loading') {
    return (
      <div className="h-full grid place-items-center" role="status" aria-label={t('auth.loading')}>
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <span className="grid place-items-center w-12 h-12 rounded-2xl bg-water shadow-[0_0_24px_rgba(14,165,233,.5)]">
            <Droplets size={24} className="text-white" />
          </span>
          <span className="flex items-center gap-2 text-sm">
            <Loader2 size={15} className="animate-spin" /> {t('auth.loading')}
          </span>
        </div>
      </div>
    )
  }
  if (status === 'anonymous') return <LoginPage />
  return children
}
