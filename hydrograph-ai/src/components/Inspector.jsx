import { Trash2, Sparkles, MousePointerClick } from 'lucide-react'
import { META, velocity, pipeStatus, suggestDiameter } from '../data'

const Slider = ({ label, unit, value, min, max, step = 1, onChange }) => (
  <label className="block">
    <div className="flex justify-between text-xs mb-1.5">
      <span className="text-slate-400">{label}</span>
      <span className="font-mono tabular-nums text-slate-100">{value} <span className="text-slate-500">{unit}</span></span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-sky-500" />
  </label>
)
const Metric = ({ label, value, unit, bad }) => (
  <div className="rounded-lg bg-app/60 border border-line p-3">
    <div className="text-xs text-slate-400">{label}</div>
    <div className={`font-mono text-xl font-semibold tabular-nums ${bad ? 'text-orange-400' : 'text-sky-300'}`}>{value}<span className="text-xs text-slate-500 ml-1">{unit}</span></div>
  </div>
)

export default function Inspector({ net, selected, running, onNode, onPipe, onDelete, onCommit, onSelect }) {
  const node = selected?.kind === 'node' && net.nodes.find((n) => n.id === selected.id)
  const pipe = selected?.kind === 'pipe' && net.pipes.find((p) => p.id === selected.id)

  return (
    <aside onPointerDownCapture={(e) => e.target.type === 'range' && onCommit()} className="w-80 shrink-0 bg-panel border-l border-line overflow-y-auto">
      <div className="h-11 px-4 flex items-center justify-between border-b border-line">
        <h2 className="text-sm font-semibold">Inspector</h2>
        {selected && <button onClick={onDelete} title="Eliminar" className="text-slate-400 hover:text-red-400 transition"><Trash2 size={16} /></button>}
      </div>

      {!selected && (
        <div className="p-4 space-y-4 rise">
          <div className="grid grid-cols-2 gap-2">
            <Metric label="Componentes" value={net.nodes.length} />
            <Metric label="Tuberías" value={net.pipes.length} />
            <Metric label="Caudal máx." value={Math.max(0, ...net.pipes.map((p) => p.flow))} unit="L/s" />
            <Metric label="Presión mín." value={net.nodes.length ? Math.min(...net.nodes.map((n) => n.pressure)) : 0} unit="m.c.a." bad={net.nodes.some((n) => n.pressure < 10)} />
          </div>
          <table className="w-full text-xs font-mono tabular-nums">
            <thead className="text-slate-500 text-left"><tr><th className="font-normal pb-1">Tramo</th><th className="font-normal">DN</th><th className="font-normal">L/s</th><th className="font-normal text-right">m/s</th></tr></thead>
            <tbody>
              {net.pipes.map((p) => {
                const v = velocity(p), bad = v > 2.5
                return (
                  <tr key={p.id} onClick={() => onSelect({ kind: 'pipe', id: p.id })} className="cursor-pointer border-t border-line hover:bg-white/5">
                    <td className="py-1.5 text-slate-300">{p.from}→{p.to}</td><td>{p.diameter}</td><td>{p.flow}</td>
                    <td className={`text-right ${bad ? 'text-orange-400 font-semibold' : 'text-slate-300'}`}>{bad && '▲ '}{v.toFixed(2)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="flex items-start gap-2 text-xs text-slate-500"><MousePointerClick size={14} className="shrink-0 mt-0.5" />Selecciona un tramo o componente para editar sus propiedades.</p>
        </div>
      )}

      {node && (
        <div key={node.id} className="p-4 space-y-5 rise">
          <div>
            <div className="text-xs text-slate-400 mb-1">{META[node.type].label} · <span className="font-mono">{node.id}</span></div>
            <input value={node.name} onChange={(e) => onNode(node.id, { name: e.target.value })} className="w-full bg-app border border-line rounded-lg px-3 py-1.5 text-sm outline-none focus:border-sky-500" />
          </div>
          <Slider label="Presión" unit="m.c.a." value={node.pressure} min={0} max={60} onChange={(v) => onNode(node.id, { pressure: v })} />
          <Slider label="Cota" unit="m" value={node.elevation} min={0} max={100} onChange={(v) => onNode(node.id, { elevation: v })} />
          {node.type === 'junction' && <Slider label="Demanda" unit="L/s" value={node.demand ?? 0} min={0} max={20} onChange={(v) => onNode(node.id, { demand: v })} />}
          <div className="grid grid-cols-2 gap-2 font-mono text-xs text-slate-400">
            <div>x: <span className="text-slate-200">{node.x}</span></div><div>y: <span className="text-slate-200">{node.y}</span></div>
          </div>
        </div>
      )}

      {pipe && (() => {
        const v = velocity(pipe), warn = pipeStatus(pipe, running) === 'warn', dn = suggestDiameter(pipe)
        return (
          <div key={pipe.id} className="p-4 space-y-5 rise">
            <div className="text-xs text-slate-400">Tubería · <span className="font-mono">{pipe.from} → {pipe.to}</span></div>
            <Slider label="Diámetro" unit="mm" value={pipe.diameter} min={25} max={300} step={5} onChange={(d) => onPipe(pipe.id, { diameter: d })} />
            <Slider label="Caudal" unit="L/s" value={pipe.flow} min={1} max={30} onChange={(q) => onPipe(pipe.id, { flow: q })} />
            <div className="grid grid-cols-2 gap-2">
              <Metric label="Velocidad" value={v.toFixed(2)} unit="m/s" bad={v > 2.5} />
              <Metric label="Caudal" value={pipe.flow} unit="L/s" />
            </div>
            {warn && (
              <div className="rounded-xl p-[1.5px] bg-danger">
                <div className="rounded-xl bg-app p-3 text-xs space-y-2">
                  <p className="text-orange-300 font-medium">Velocidad excesiva: riesgo de sobrepresión y desgaste.</p>
                  <button onClick={() => { onCommit(); onPipe(pipe.id, { diameter: dn }) }} className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-ai text-white font-medium hover:brightness-110 transition">
                    <Sparkles size={13} /> Aplicar DN{dn} sugerido por IA
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
