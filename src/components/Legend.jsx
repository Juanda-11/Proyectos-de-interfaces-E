import { META } from '../lib/componentTypes'
import { TIER_COLORS } from '../lib/tiers'

const TIERS = [
  ['ok', 'Normal (hasta 2 m/s)'],
  ['caution', 'Atención (2–2,5 m/s)'],
  ['warn', 'Excesiva (más de 2,5 m/s)'],
]

/** Leyenda plegable del lienzo: tipos de componente y, al simular, niveles de velocidad. */
export default function Legend({ running }) {
  return (
    <details className="absolute bottom-6 left-4 w-52 rounded-xl bg-panel/90 border border-line text-xs backdrop-blur group">
      <summary className="cursor-pointer select-none list-none px-3 py-2 text-slate-300 font-medium flex items-center justify-between">
        Leyenda <span className="text-slate-500 group-open:rotate-180 transition">▾</span>
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
          <ul className="space-y-1 border-t border-line pt-2" aria-label="Velocidad en tuberías">
            {TIERS.map(([tier, label]) => (
              <li key={tier} className="flex items-center gap-2 text-slate-300">
                <i
                  className="w-5 h-1.5 rounded-full"
                  style={{ background: `linear-gradient(90deg, ${TIER_COLORS[tier].join(',')})` }}
                />
                {label}
              </li>
            ))}
          </ul>
        ) : (
          <p className="border-t border-line pt-2 text-slate-500">
            Simula para colorear las tuberías por velocidad.
          </p>
        )}
      </div>
    </details>
  )
}
