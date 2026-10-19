import {
  Trash2,
  Sparkles,
  MousePointerClick,
  OctagonAlert,
  TriangleAlert,
  Info,
} from 'lucide-react'
import { useI18n } from '../i18n/I18nProvider'
import { META } from '../lib/componentTypes'
import { velocity, MAX_V, suggestDiameter } from '../lib/hydraulics'

const Slider = ({ label, unit, value, min, max, step = 1, onChange }) => (
  <label className="block">
    <div className="flex justify-between text-xs mb-1.5">
      <span className="text-slate-400">{label}</span>
      <span className="font-mono tabular-nums text-slate-100">
        {value} <span className="text-slate-500">{unit}</span>
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(+e.target.value)}
      className="w-full accent-sky-500"
    />
  </label>
)
const Metric = ({ label, value, unit, bad }) => (
  <div className="rounded-lg bg-app/60 border border-line p-3">
    <div className="text-xs text-slate-400">{label}</div>
    <div
      className={`font-mono text-xl font-semibold tabular-nums ${bad ? 'text-orange-400' : 'text-sky-300'}`}
    >
      {value}
      <span className="text-xs text-slate-500 ml-1">{unit}</span>
    </div>
  </div>
)
const SEVERITY = {
  critical: [OctagonAlert, 'text-red-400'],
  warning: [TriangleAlert, 'text-orange-400'],
  info: [Info, 'text-sky-400'],
}

/** Etiquetas del control de «presión» según el tipo: para tanques y bombas no es una presión. */
const PRESSURE_FIELD = {
  tank: { label: 'inspector.waterLevel', unit: 'm', max: 60 },
  pump: { label: 'inspector.pumpHead', unit: 'm', max: 100 },
}

export default function Inspector({
  net,
  selected,
  running,
  simulation,
  onNode,
  onPipe,
  onDelete,
  onCommit,
  onSelect,
}) {
  const { t } = useI18n()
  const node = selected?.kind === 'node' && net.nodes.find((n) => n.id === selected.id)
  const pipe = selected?.kind === 'pipe' && net.pipes.find((p) => p.id === selected.id)
  const { result, issues, pipeResult, nodeResult } = simulation
  const minPressure = result?.summary.minPressure

  // Los controles de rango agrupan un gesto (arrastre o pulsación de tecla) en un solo paso de deshacer
  const commitOnRange = (e) => e.target.type === 'range' && !e.repeat && onCommit()

  const issueTarget = (id) =>
    net.pipes.some((p) => p.id === id) ? 'pipe' : net.nodes.some((n) => n.id === id) ? 'node' : null

  return (
    <aside
      aria-label="Inspector"
      onPointerDownCapture={commitOnRange}
      onKeyDownCapture={(e) => e.key.startsWith('Arrow') && commitOnRange(e)}
      className="w-80 shrink-0 bg-panel border-l border-line overflow-y-auto"
    >
      <div className="h-11 px-4 flex items-center justify-between border-b border-line">
        <h2 className="text-sm font-semibold">Inspector</h2>
        {selected && (
          <button
            onClick={onDelete}
            title={t('inspector.deleteTitle')}
            aria-label={t('inspector.delete')}
            className="text-slate-400 hover:text-red-400 transition"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {!selected && (
        <div className="p-4 space-y-4 rise">
          <div className="grid grid-cols-2 gap-2">
            <Metric label={t('inspector.components')} value={net.nodes.length} />
            <Metric label={t('inspector.pipes')} value={net.pipes.length} />
            <Metric
              label={t('inspector.maxFlow')}
              value={Math.max(0, ...net.pipes.map((p) => p.flow))}
              unit="L/s"
            />
            <Metric
              label={t('inspector.minPressure')}
              value={typeof minPressure === 'number' ? minPressure.toFixed(1) : '—'}
              unit={result ? t('unit.pressure') : ''}
              bad={typeof minPressure === 'number' && minPressure < 10}
            />
          </div>

          {issues.length > 0 && (
            <section aria-label={t('inspector.issues')} className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-300">{t('inspector.issues')}</h3>
              <ul className="space-y-1.5">
                {issues.map((i, k) => {
                  const [Icon, tint] = SEVERITY[i.severity]
                  const kind = i.elementId && issueTarget(i.elementId)
                  const body = (
                    <>
                      <Icon size={14} className={`shrink-0 mt-0.5 ${tint}`} />
                      <span>
                        <span className="text-slate-200">{i.message}</span>
                        {i.suggestion && (
                          <span className="block text-slate-400 mt-0.5">{i.suggestion}</span>
                        )}
                      </span>
                    </>
                  )
                  return (
                    <li key={`${i.code}-${i.elementId}-${k}`}>
                      {kind ? (
                        <button
                          onClick={() => onSelect({ kind, id: i.elementId })}
                          className="w-full flex gap-2 text-left text-xs p-2 rounded-lg bg-app/60 border border-line hover:border-orange-400/50 transition"
                        >
                          {body}
                        </button>
                      ) : (
                        <div className="flex gap-2 text-xs p-2 rounded-lg bg-app/60 border border-line">
                          {body}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          <table className="w-full text-xs font-mono tabular-nums">
            <thead className="text-slate-500 text-left">
              <tr>
                <th className="font-normal pb-1">{t('inspector.pipe')}</th>
                <th className="font-normal">DN</th>
                <th className="font-normal">L/s</th>
                <th className="font-normal text-right">m/s</th>
                {result && <th className="font-normal text-right">hf (m)</th>}
              </tr>
            </thead>
            <tbody>
              {net.pipes.map((p) => {
                const v = velocity(p),
                  bad = v > MAX_V
                return (
                  <tr
                    key={p.id}
                    onClick={() => onSelect({ kind: 'pipe', id: p.id })}
                    className="cursor-pointer border-t border-line hover:bg-white/5"
                  >
                    <td className="py-1.5 text-slate-300">
                      {p.from}→{p.to}
                    </td>
                    <td>{p.diameter}</td>
                    <td>{p.flow}</td>
                    <td
                      className={`text-right ${bad ? 'text-orange-400 font-semibold' : 'text-slate-300'}`}
                    >
                      {bad && '▲ '}
                      {v.toFixed(2)}
                    </td>
                    {result && (
                      <td className="text-right text-slate-300">
                        {pipeResult(p.id)?.headLoss.toFixed(2) ?? '—'}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="flex items-start gap-2 text-xs text-slate-500">
            <MousePointerClick size={14} className="shrink-0 mt-0.5" />
            {t('inspector.hint')}
            {!running && ` ${t('inspector.hintSimulate')}`}
          </p>
        </div>
      )}

      {node &&
        (() => {
          const field = PRESSURE_FIELD[node.type]
          const res = nodeResult(node.id)
          return (
            <div key={node.id} className="p-4 space-y-5 rise">
              <div>
                <label htmlFor="node-name" className="block text-xs text-slate-400 mb-1">
                  {META[node.type].label} · <span className="font-mono">{node.id}</span>
                </label>
                <input
                  id="node-name"
                  value={node.name}
                  onChange={(e) => onNode(node.id, { name: e.target.value })}
                  className="w-full bg-app border border-line rounded-lg px-3 py-1.5 text-sm outline-none focus:border-sky-500"
                />
              </div>
              {field && (
                <Slider
                  label={t(field.label)}
                  unit={field.unit}
                  value={node.pressure}
                  min={0}
                  max={field.max}
                  onChange={(v) => onNode(node.id, { pressure: v })}
                />
              )}
              <Slider
                label={t('inspector.elevation')}
                unit="m"
                value={node.elevation}
                min={0}
                max={100}
                onChange={(v) => onNode(node.id, { elevation: v })}
              />
              {node.type === 'junction' && (
                <Slider
                  label={t('inspector.demand')}
                  unit="L/s"
                  value={node.demand ?? 0}
                  min={0}
                  max={20}
                  onChange={(v) => onNode(node.id, { demand: v })}
                />
              )}
              {res && res.pressure !== null && (
                <Metric
                  label={
                    node.type === 'tank'
                      ? t('inspector.bottomPressure')
                      : t('inspector.computedPressure')
                  }
                  value={res.pressure.toFixed(1)}
                  unit={t('unit.pressure')}
                  bad={res.status !== 'ok'}
                />
              )}
              {res?.status === 'disconnected' && (
                <p className="text-xs text-orange-300">{t('inspector.disconnected')}</p>
              )}
              <div className="grid grid-cols-2 gap-2 font-mono text-xs text-slate-400">
                <div>
                  x: <span className="text-slate-200">{node.x}</span>
                </div>
                <div>
                  y: <span className="text-slate-200">{node.y}</span>
                </div>
              </div>
            </div>
          )
        })()}

      {pipe &&
        (() => {
          const res = pipeResult(pipe.id)
          const v = velocity(pipe),
            warn = running && v > MAX_V
          const dn = res?.suggestedDiameter ?? suggestDiameter(pipe)
          return (
            <div key={pipe.id} className="p-4 space-y-5 rise">
              <div className="text-xs text-slate-400">
                {t('inspector.pipeTitle')} ·{' '}
                <span className="font-mono">
                  {pipe.from} → {pipe.to}
                </span>
              </div>
              <Slider
                label={t('inspector.diameter')}
                unit="mm"
                value={pipe.diameter}
                min={25}
                max={300}
                step={5}
                onChange={(d) => onPipe(pipe.id, { diameter: d })}
              />
              <Slider
                label={t('inspector.flow')}
                unit="L/s"
                value={pipe.flow}
                min={1}
                max={30}
                onChange={(q) => onPipe(pipe.id, { flow: q })}
              />
              <div className="grid grid-cols-2 gap-2">
                <Metric
                  label={t('inspector.velocity')}
                  value={v.toFixed(2)}
                  unit="m/s"
                  bad={v > MAX_V}
                />
                <Metric label={t('inspector.flow')} value={pipe.flow} unit="L/s" />
                {res && (
                  <Metric
                    label={t('inspector.headLoss')}
                    value={res.headLoss.toFixed(2)}
                    unit="m"
                  />
                )}
                {res && <Metric label={t('inspector.length')} value={res.length} unit="m" />}
              </div>
              {warn && (
                <div className="rounded-xl p-[1.5px] bg-danger">
                  <div className="rounded-xl bg-app p-3 text-xs space-y-2">
                    <p className="text-orange-300 font-medium">{t('inspector.velocityWarning')}</p>
                    <button
                      onClick={() => {
                        onCommit()
                        onPipe(pipe.id, { diameter: dn })
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-ai text-white font-medium hover:brightness-110 transition"
                    >
                      <Sparkles size={13} /> {t('inspector.applyDn', { dn })}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })()}
    </aside>
  )
}
