import { useRef, useState, useEffect } from 'react'
import { Plus, Minus, Maximize, Grid3x3 } from 'lucide-react'
import { META, pipeStatus } from '../data'

const GRID = 20
const snap = (v) => Math.round(v / GRID) * GRID

export default function Canvas({ nodes, pipes, selected, tool, running, view, onView, snapOn, onToggleSnap, onDragStart, onSelect, onMove, onConnect }) {
  const svg = useRef(null)
  const drag = useRef(null)
  const pan = useRef(null)
  const sn = (v) => (snapOn ? snap(v) : Math.round(v))
  const zoomTo = (k, sx, sy) => {
    k = Math.min(3, Math.max(0.3, k))
    onView({ k, x: sx - ((sx - view.x) * k) / view.k, y: sy - ((sy - view.y) * k) / view.k })
  }
  const center = () => { const r = svg.current.getBoundingClientRect(); return [r.width / 2, r.height / 2] }
  const [first, setFirst] = useState(null) // primer nodo elegido con la herramienta Tubería
  useEffect(() => setFirst(null), [tool])

  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]))
  const point = (e) => {
    const r = svg.current.getBoundingClientRect()
    return { x: (e.clientX - r.left - view.x) / view.k, y: (e.clientY - r.top - view.y) / view.k } // coordenadas del mundo
  }
  const down = (e, n) => {
    e.stopPropagation()
    if (tool === 'pipe') {
      if (!first) setFirst(n.id)
      else { if (first !== n.id) onConnect(first, n.id); setFirst(null) }
      return
    }
    const p = point(e)
    drag.current = { id: n.id, dx: p.x - n.x, dy: p.y - n.y }
    svg.current.setPointerCapture(e.pointerId)
    onSelect({ kind: 'node', id: n.id })
  }
  const move = (e) => {
    if (pan.current) {
      const q = pan.current
      onView({ ...view, x: q.vx + e.clientX - q.sx, y: q.vy + e.clientY - q.sy })
      return
    }
    const d = drag.current
    if (!d) return
    if (!d.moved) { onDragStart(); d.moved = true } // un solo paso de deshacer por arrastre
    const p = point(e)
    onMove(d.id, sn(p.x - d.dx), sn(p.y - d.dy))
  }
  const wheel = (e) => {
    const r = svg.current.getBoundingClientRect()
    zoomTo(view.k * (e.deltaY < 0 ? 1.1 : 0.9), e.clientX - r.left, e.clientY - r.top)
  }
  const bgDown = (e) => {
    onSelect(null)
    pan.current = { sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y }
    svg.current.setPointerCapture(e.pointerId)
  }

  return (
    <>
      <svg
        ref={svg} className="w-full h-full touch-none"
        style={{ cursor: tool === 'pipe' ? 'crosshair' : 'default' }}
        onWheel={wheel} onPointerMove={move} onPointerUp={() => { drag.current = null; pan.current = null }} onPointerDown={bgDown}
      >
        <defs>
          <pattern id="minor" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
            <path d={`M${GRID} 0H0V${GRID}`} fill="none" stroke="#1E293B" strokeWidth="1" />
          </pattern>
          <pattern id="major" width={GRID * 5} height={GRID * 5} patternUnits="userSpaceOnUse">
            <rect width={GRID * 5} height={GRID * 5} fill="url(#minor)" />
            <path d={`M${GRID * 5} 0H0V${GRID * 5}`} fill="none" stroke="#334155" strokeWidth="1" />
          </pattern>
        </defs>
        <g transform={`translate(${view.x},${view.y}) scale(${view.k})`}>
        <rect x="-6000" y="-6000" width="12000" height="12000" fill="url(#major)" />

        {pipes.map((p) => {
          const a = byId[p.from], b = byId[p.to]
          if (!a || !b) return null
          const st = pipeStatus(p, running)
          const warn = st === 'warn'
          const w = Math.max(5, p.diameter / 14)
          const sel = selected?.kind === 'pipe' && selected.id === p.id
          const l = { x1: a.x, y1: a.y, x2: b.x, y2: b.y, strokeLinecap: 'round' }
          return (
            <g key={p.id} className={`cursor-pointer ${warn ? 'alert' : ''}`} onPointerDown={(e) => { e.stopPropagation(); onSelect({ kind: 'pipe', id: p.id }) }}>
              <linearGradient id={`g${p.id}`} gradientUnits="userSpaceOnUse" x1={a.x} y1={a.y} x2={b.x} y2={b.y}>
                <stop offset="0" stopColor={warn ? '#F97316' : '#0EA5E9'} />
                <stop offset="1" stopColor={warn ? '#EF4444' : '#2563EB'} />
              </linearGradient>
              {sel && <line {...l} stroke="#38BDF8" strokeOpacity=".3" strokeWidth={w + 12} />}
              <line {...l} stroke="#0B1220" strokeWidth={w + 6} />
              <line {...l} stroke={`url(#g${p.id})`} strokeWidth={w} opacity={st === 'idle' ? 0.55 : 1} />
              {running && <line {...l} stroke="#fff" strokeOpacity=".85" strokeWidth="2.5" strokeDasharray="2 22" className="flow" />}
              <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - w - 8} textAnchor="middle" className="fill-slate-400 text-[10px] font-mono select-none">DN{p.diameter}</text>
            </g>
          )
        })}

        {nodes.map((n) => {
          const m = META[n.type], Icon = m.icon
          const sel = selected?.kind === 'node' && selected.id === n.id
          return (
            <g key={n.id} transform={`translate(${n.x - 28},${n.y - 28})`} onPointerDown={(e) => down(e, n)} className="cursor-grab active:cursor-grabbing">
              <rect width="56" height="56" rx="14" fill="#1E293B" stroke={sel || first === n.id ? '#38BDF8' : m.color} strokeWidth={sel ? 2.5 : 1.5} style={{ filter: `drop-shadow(0 0 8px ${m.color}66)` }} />
              <foreignObject width="56" height="56">
                <div className="w-full h-full grid place-items-center" style={{ color: m.color }}><Icon size={26} /></div>
              </foreignObject>
              <text x="28" y="74" textAnchor="middle" className="fill-slate-300 text-[11px] font-mono select-none">{n.name}</text>
            </g>
          )
        })}
        </g>
      </svg>
      {tool === 'pipe' && (
        <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-panel/90 border border-line text-xs text-sky-300">
          {first ? 'Elige el segundo componente' : 'Haz clic en dos componentes para conectarlos'}
        </div>
      )}
      <div className="absolute bottom-6 right-4 flex flex-col gap-1 p-1 rounded-xl bg-panel/90 border border-line">
        {[
          [Plus, 'Acercar', () => zoomTo(view.k * 1.25, ...center())],
          [Minus, 'Alejar', () => zoomTo(view.k / 1.25, ...center())],
          [Maximize, 'Restablecer vista', () => onView({ x: 0, y: 0, k: 1 })],
        ].map(([Icon, t, fn]) => (
          <button key={t} title={t} onClick={fn} className="w-8 h-8 grid place-items-center rounded-lg text-slate-300 hover:bg-white/10 transition"><Icon size={16} /></button>
        ))}
        <button title="Ajuste a cuadrícula" onClick={onToggleSnap} className={`w-8 h-8 grid place-items-center rounded-lg transition ${snapOn ? 'bg-water text-white' : 'text-slate-400 hover:bg-white/10'}`}><Grid3x3 size={16} /></button>
      </div>
    </>
  )
}
