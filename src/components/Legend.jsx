import { META } from '../lib/componentTypes'
import { TIER_COLORS } from '../lib/tiers'
import { useI18n } from '../i18n/I18nProvider'

const TIERS = [
  ['ok', 'legend.tier.ok'],
  ['caution', 'legend.tier.caution'],
  ['warn', 'legend.tier.warn'],
]

/** Leyenda plegable del lienzo: tipos de componente y, al simular, niveles de velocidad. */
export default function Legend({ running }) {
  const { t } = useI18n()
  return (
    <details className="absolute bottom-6 left-4 w-52 rounded-xl bg-panel/90 border border-line text-xs backdrop-blur group">
      <summary className="cursor-pointer select-none list-none px-3 py-2 text-slate-300 font-medium flex items-center justify-between">
        {t('legend.title')}{' '}
        <span className="text-slate-500 group-open:rotate-180 transition">▾</span>
      </summary>
      <div className="px-3 pb-3 space-y-3">
        <ul className="space-y-1">
          {Object.entries(META).map(([type, m]) => (
            <li key={type} className="flex items-center gap-2 text-slate-300">
              <m.icon size={14} style={{ color: m.color }} /> {m.label}
            </li>
          ))}
        </ul>
        {running ? (
          <ul className="space-y-1 border-t border-line pt-2" aria-label={t('legend.velocity')}>
            {TIERS.map(([tier, label]) => (
              <li key={tier} className="flex items-center gap-2 text-slate-300">
                <i
                  className="w-5 h-1.5 rounded-full"
                  style={{ background: `linear-gradient(90deg, ${TIER_COLORS[tier].join(',')})` }}
                />
                {t(label)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="border-t border-line pt-2 text-slate-500">{t('legend.hint')}</p>
        )}
      </div>
    </details>
  )
}
