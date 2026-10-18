import { useRef, useState } from 'react'
import { Plus, Minus, Scan, Grid3x3, Magnet, Maximize2, Minimize2 } from 'lucide-react'
import { fitView } from '../lib/view'
import { useFullscreen } from '../hooks/useFullscreen'
import { META } from '../lib/componentTypes'
import { velocity, velocityTier } from '../lib/hydraulics'
import { TIER_COLORS } from '../lib/tiers'

const GRID = 20
const ZOOM_BTN =
  'w-8 h-8 grid place-items-center rounded-lg text-slate-300 hover:bg-white/10 transition'
const toggleBtn = (on) =>
  `w-8 h-8 grid place-items-center rounded-lg transition ${on ? 'bg-water text-white' : 'text-slate-400 hover:bg-white/10'}`
const snap = (v) => Math.round(v / GRID) * GRID
/** Contorno del color del fondo para que las etiquetas se lean sobre las tuberías */
const HALO = { paintOrder: 'stroke', stroke: '#0F172A', strokeWidth: 3, strokeLinejoin: 'round' }
const NUDGE = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }

export default function Canvas({
  nodes,
  pipes,
  selected,
  tool,
  running,
  view,
  onView,
  snapOn,
  onToggleSnap,
  gridOn = true,
  onToggleGrid = () => {},
  onDragStart,
  onSelect,
  onMove,
  onConnect,
  onNudge,
  statusOfPipe,
  nodeResult = () => null,
}) {
  const svg = useRef(null)
  const drag = useRef(null)
  const pan = useRef(null)
  const sn = (v) => (snapOn ? snap(v) : Math.round(v))
  const zoomTo = (k, sx, sy) => {
    k = Math.min(3, Math.max(0.3, k))
    onView({ k, x: sx - ((sx - view.x) * k) / view.k, y: sy - ((sy - view.y) * k) / view.k })
  }
  const fullscreen = useFullscreen()
  const fit = () => {
    const r = svg.current.getBoundingClientRect()
    onView(fitView(nodes, r.width, r.height))
  }
  const zoomBy = (factor) => {
    const r = svg.current.getBoundingClientRect()
    zoomTo(view.k * factor, r.width / 2, r.height / 2)
  }
  // Primer nodo elegido con la herramienta Tubería; se descarta al cambiar de herramienta
  const [pending, setPending] = useState({ tool, id: null })
  const first = pending.tool === tool ? pending.id : null
  const setFirst = (id) => setPending({ tool, id })

  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]))
  const point = (e) => {
    const r = svg.current.getBoundingClientRect()
    return { x: (e.clientX - r.left - view.x) / view.k, y: (e.clientY - r.top - view.y) / view.k } // coordenadas del mundo
  }
  const pick = (n) => {
    if (tool === 'pipe') {
      if (!first) setFirst(n.id)
      else {
        if (first !== n.id) onConnect(first, n.id)
        setFirst(null)
      }
      return true
    }
    return false
  }
  const down = (e, n) => {
    e.stopPropagation()
    if (pick(n)) return
    const p = point(e)
    drag.current = { id: n.id, dx: p.x - n.x, dy: p.y - n.y }
    svg.current.setPointerCapture(e.pointerId)
    onSelect({ kind: 'node', id: n.id })
  }
  const nodeKey = (e, n) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (!pick(n)) onSelect({ kind: 'node', id: n.id })
    } else if (NUDGE[e.key]) {
      e.preventDefault()
      const [dx, dy] = NUDGE[e.key]
      onNudge?.(n.id, n.x + dx * GRID, n.y + dy * GRID)
    }
  }
  const move = (e) => {
    if (pan.current) {
      const q = pan.current
      onView({ ...view, x: q.vx + e.clientX - q.sx, y: q.vy + e.clientY - q.sy })
      return
    }
    const d = drag.current
    if (!d) return
    if (!d.moved) {
      onDragStart()
      d.moved = true
    } // un solo paso de deshacer por arrastre
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
        ref={svg}
        className="w-full h-full touch-none"
        role="group"
        aria-label="Lienzo de la red de agua"
        style={{ cursor: tool === 'pipe' ? 'crosshair' : 'default' }}
        onWheel={wheel}
        onPointerMove={move}
        onPointerUp={() => {
          drag.current = null
          pan.current = null
        }}
        onPointerDown={bgDown}
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
          {gridOn && <rect x="-6000" y="-6000" width="12000" height="12000" fill="url(#major)" />}

          {pipes.map((p) => {
            const a = byId[p.from],
              b = byId[p.to]
            if (!a || !b) return null
            const st = statusOfPipe(p)
            const warn = st === 'warn'
            const tier = warn ? 'warn' : running ? velocityTier(p) : 'ok'
            const [c0, c1] = TIER_COLORS[tier]
            const w = Math.max(5, p.diameter / 14)
            const sel = selected?.kind === 'pipe' && selected.id === p.id
            const l = { x1: a.x, y1: a.y, x2: b.x, y2: b.y, strokeLinecap: 'round' }
            const choose = () => onSelect({ kind: 'pipe', id: p.id })
            return (
              <g
                key={p.id}
                className={`cursor-pointer ${warn ? 'alert' : ''}`}
                role="button"
                tabIndex={0}
                aria-label={`Tubería ${a.name} a ${b.name}, DN${p.diameter}${warn ? ', velocidad excesiva' : ''}`}
                aria-pressed={sel}
                onPointerDown={(e) => {
                  e.stopPropagation()
                  choose()
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    choose()
                  }
                }}
              >
                <linearGradient
                  id={`g${p.id}`}
                  gradientUnits="userSpaceOnUse"
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                >
                  <stop offset="0" stopColor={c0} />
                  <stop offset="1" stopColor={c1} />
                </linearGradient>
                {sel && <line {...l} stroke="#38BDF8" strokeOpacity=".3" strokeWidth={w + 12} />}
                <line {...l} stroke="#0B1220" strokeWidth={w + 6} />
                <line
                  {...l}
                  stroke={`url(#g${p.id})`}
                  strokeWidth={w}
                  opacity={st === 'idle' ? 0.55 : 1}
                />
                {running && (
                  <line
                    {...l}
                    stroke="#fff"
                    strokeOpacity=".85"
                    strokeWidth="2.5"
                    strokeDasharray="2 22"
                    className="flow"
                  />
                )}
                <text
                  x={(a.x + b.x) / 2}
                  y={(a.y + b.y) / 2 - w - 8}
                  textAnchor="middle"
                  className={`text-[10px] font-mono select-none ${warn ? 'fill-orange-300' : tier === 'caution' ? 'fill-amber-300' : 'fill-slate-400'}`}
                  style={HALO}
                >
                  DN{p.diameter}
                  {running && ` · ${velocity(p).toFixed(1)} m/s`}
                </text>
              </g>
            )
          })}

          {nodes.map((n) => {
            const m = META[n.type],
              Icon = m.icon
            const sel = selected?.kind === 'node' && selected.id === n.id
            const res = nodeResult(n.id)
            const bad = res && res.status !== 'ok'
            return (
              <g
                key={n.id}
                transform={`translate(${n.x - 28},${n.y - 28})`}
                role="button"
                tabIndex={0}
                aria-label={`${n.name}, ${m.label.toLowerCase()}${typeof res?.pressure === 'number' ? `, ${res.pressure} metros de columna de agua` : ''}`}
                aria-pressed={sel}
                onPointerDown={(e) => down(e, n)}
                onKeyDown={(e) => nodeKey(e, n)}
                className="cursor-grab active:cursor-grabbing"
              >
                <rect
                  width="56"
                  height="56"
                  rx="14"
                  fill="#1E293B"
                  stroke={sel || first === n.id ? '#38BDF8' : bad ? '#F97316' : m.color}
                  strokeWidth={sel ? 2.5 : 1.5}
                  style={{ filter: `drop-shadow(0 0 8px ${m.color}66)` }}
                />
                <foreignObject width="56" height="56">
                  <div className="w-full h-full grid place-items-center" style={{ color: m.color }}>
                    <Icon size={26} />
                  </div>
                </foreignObject>
                <text
                  x="28"
                  y="74"
                  textAnchor="middle"
                  className="fill-slate-300 text-[11px] font-mono select-none"
                  style={HALO}
                >
                  {n.name}
                </text>
                {typeof res?.pressure === 'number' && (
                  <text
                    x="28"
                    y="88"
                    textAnchor="middle"
                    className={`text-[10px] font-mono select-none ${bad ? 'fill-orange-400' : 'fill-sky-300'}`}
                  >
                    {res.pressure.toFixed(1)} m.c.a.
                  </text>
                )}
              </g>
            )
          })}
        </g>
      </svg>
      {nodes.length === 0 && (
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <p className="max-w-xs text-center text-sm text-slate-400">
            El lienzo está vacío. Añade un tanque desde la paleta o pide una red al copiloto{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-panel border border-line text-[11px] font-mono">
              Ctrl K
            </kbd>
          </p>
        </div>
      )}
      {tool === 'pipe' && (
        <div
          className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-panel/90 border border-line text-xs text-sky-300"
          role="status"
        >
          {first ? 'Elige el segundo componente' : 'Haz clic en dos componentes para conectarlos'}
        </div>
      )}
      <div className="absolute bottom-6 right-4 flex flex-col gap-1 p-1 rounded-xl bg-panel/90 border border-line">
        <button
          title="Acercar"
          aria-label="Acercar"
          onClick={() => zoomBy(1.25)}
          className={ZOOM_BTN}
        >
          <Plus size={16} />
        </button>
        <button
          title="Alejar"
          aria-label="Alejar"
          onClick={() => zoomBy(1 / 1.25)}
          className={ZOOM_BTN}
        >
          <Minus size={16} />
        </button>
        <button
          title="Encuadrar toda la red"
          aria-label="Encuadrar toda la red"
          onClick={fit}
          className={ZOOM_BTN}
        >
          <Scan size={16} />
        </button>
        <button
          title="Mostrar cuadrícula"
          aria-label="Mostrar cuadrícula"
          aria-pressed={gridOn}
          onClick={onToggleGrid}
          className={toggleBtn(gridOn)}
        >
          <Grid3x3 size={16} />
        </button>
        <button
          title="Imán: ajustar los nodos a la cuadrícula al moverlos"
          aria-label="Ajuste a cuadrícula"
          aria-pressed={snapOn}
          onClick={onToggleSnap}
          className={toggleBtn(snapOn)}
        >
          <Magnet size={16} />
        </button>
        {fullscreen.supported && (
          <button
            title={fullscreen.active ? 'Salir de pantalla completa' : 'Pantalla completa'}
            aria-label={fullscreen.active ? 'Salir de pantalla completa' : 'Pantalla completa'}
            aria-pressed={fullscreen.active}
            onClick={fullscreen.toggle}
            className={ZOOM_BTN}
          >
            {fullscreen.active ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        )}
      </div>
    </>
  )
}
