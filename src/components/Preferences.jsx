import { Moon, Sun } from 'lucide-react'
import { useI18n } from '../i18n/I18nProvider'

/** Botones de tema (claro/oscuro) e idioma (ES/EN); se usan en la barra superior y en la pantalla de acceso. */
export default function Preferences({ theme, onToggleTheme }) {
  const { t, lang, setLang } = useI18n()
  const label = theme === 'dark' ? t('topbar.theme.toLight') : t('topbar.theme.toDark')
  return (
    <div className="flex gap-1">
      <button
        onClick={onToggleTheme}
        title={label}
        aria-label={label}
        className="w-8 h-8 grid place-items-center rounded-lg border border-line text-slate-300 hover:bg-white/5 transition"
      >
        {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
      </button>
      <div
        role="group"
        aria-label={t('topbar.language')}
        className="flex rounded-lg border border-line overflow-hidden text-xs font-medium"
      >
        {[
          ['es', 'ES', 'Español'],
          ['en', 'EN', 'English'],
        ].map(([code, short, name]) => (
          <button
            key={code}
            onClick={() => setLang(code)}
            aria-pressed={lang === code}
            aria-label={name}
            title={name}
            className={`px-2 h-8 transition ${lang === code ? 'bg-water text-white' : 'text-slate-300 hover:bg-white/5'}`}
          >
            {short}
          </button>
        ))}
      </div>
    </div>
  )
}
