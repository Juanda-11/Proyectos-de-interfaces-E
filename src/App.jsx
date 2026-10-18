import { useState, useEffect } from 'react'
import TopBar from './components/TopBar'
import Toolbar from './components/Toolbar'
import Canvas from './components/Canvas'
import Inspector from './components/Inspector'
import Copilot from './components/Copilot'
import { META } from './lib/componentTypes'
import { makeSectors, newId } from './lib/network'
import { pipeStatus, suggestDiameter } from './lib/hydraulics'

const uid = newId

export default function App() {
  const [net, setNet] = useState(() => makeSectors(3))
  const [selected, setSelected] = useState(null) // { kind: 'node' | 'pipe', id }
  const [tool, setTool] = useState('select')
  const [running, setRunning] = useState(false)
  const [view, setView] = useState({ x: 0, y: 0, k: 1 })
  const [snapOn, setSnapOn] = useState(true)
  const [past, setPast] = useState([])
  const [future, setFuture] = useState([])

  // Historial: commit() guarda el estado actual antes de cada cambio
  const commit = () => { setPast((p) => [...p.slice(-49), net]); setFuture([]) }
  const undo = () => { if (!past.length) return; setFuture((f) => [net, ...f]); setNet(past[past.length - 1]); setPast((p) => p.slice(0, -1)); setSelected(null) }
  const redo = () => { if (!future.length) return; setPast((p) => [...p, net]); setNet(future[0]); setFuture((f) => f.slice(1)); setSelected(null) }

  const warnings = net.pipes.filter((p) => pipeStatus(p, running) === 'warn')

  const addNode = (type) => {
    commit()
    const n = net.nodes.filter((x) => x.type === type).length + 1
    const id = type[0].toUpperCase() + uid()
    const node = { id, type, x: 200 + (net.nodes.length % 8) * 40, y: 80 + (net.nodes.length % 6) * 40, name: `${META[type].label} ${n}`, ...META[type].props }
    setNet((s) => ({ ...s, nodes: [...s.nodes, node] }))
    setSelected({ kind: 'node', id })
    setTool('select')
  }
  const updateNode = (id, patch) => setNet((s) => ({ ...s, nodes: s.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)) }))
  const updatePipe = (id, patch) => setNet((s) => ({ ...s, pipes: s.pipes.map((p) => (p.id === id ? { ...p, ...patch } : p)) }))
  const connect = (from, to) => {
    if (net.pipes.some((p) => (p.from === from && p.to === to) || (p.from === to && p.to === from))) return
    commit()
    const id = 'p' + uid()
    setNet((s) => ({ ...s, pipes: [...s.pipes, { id, from, to, diameter: 100, flow: 4 }] }))
    setSelected({ kind: 'pipe', id })
    setTool('select')
  }
  const remove = () => {
    if (!selected) return
    commit()
    setNet((s) =>
      selected.kind === 'node'
        ? { nodes: s.nodes.filter((n) => n.id !== selected.id), pipes: s.pipes.filter((p) => p.from !== selected.id && p.to !== selected.id) }
        : { ...s, pipes: s.pipes.filter((p) => p.id !== selected.id) }
    )
    setSelected(null)
  }
  const exportJSON = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify(net, null, 2)], { type: 'application/json' }))
    a.download = 'hydrograph-red.json'
    a.click()
  }

  // --- Acciones del copiloto (devuelven el mensaje de respuesta) ---
  const aiGenerate = (prompt) => {
    const n = Math.min(5, Math.max(1, parseInt(prompt.match(/(\d+)\s*sector/i)?.[1] ?? '3', 10)))
    commit(); setNet(makeSectors(n)); setSelected(null); setRunning(false)
    return `Red generada: 1 tanque, 1 bomba y ${n} sectores con ${n + 2} tuberías. Pulsa "Simular Flujo" para verificar presiones.`
  }
  const aiAudit = () => {
    setRunning(true)
    const bad = net.pipes.filter((p) => pipeStatus(p, true) === 'warn')
    if (!bad.length) return 'Auditoría completa: velocidades y presiones dentro de rango. La red es estable.'
    return `Detecté ${bad.length} tramo(s) con velocidad sobre 2.5 m/s (${bad.map((p) => p.id).join(', ')}). Selecciónalo y aplica el diámetro sugerido (DN${suggestDiameter(bad[0])}).`
  }

  // Atajos: Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z / Supr
  useEffect(() => {
    const key = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName) && e.target.type !== 'range') return
      const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase()
      if (mod && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo() }
      else if (mod && k === 'y') { e.preventDefault(); redo() }
      else if (e.key === 'Delete' || e.key === 'Backspace') remove()
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  })

  return (
    <div className="h-full flex flex-col">
      <TopBar running={running} warnings={warnings.length} onToggle={() => setRunning((r) => !r)} onExport={exportJSON} canUndo={past.length > 0} canRedo={future.length > 0} onUndo={undo} onRedo={redo} />
      <div className="flex flex-1 min-h-0">
        <Toolbar tool={tool} onTool={setTool} onAdd={addNode} />
        <main className="relative flex-1 overflow-hidden">
          <Canvas
            nodes={net.nodes} pipes={net.pipes} selected={selected} tool={tool} running={running}
            view={view} onView={setView} snapOn={snapOn} onToggleSnap={() => setSnapOn((s) => !s)} onDragStart={commit}
            onSelect={setSelected} onMove={(id, x, y) => updateNode(id, { x, y })} onConnect={connect}
          />
          <Copilot onGenerate={aiGenerate} onAudit={aiAudit} />
        </main>
        <Inspector net={net} selected={selected} running={running} onNode={updateNode} onPipe={updatePipe} onDelete={remove} onCommit={commit} onSelect={setSelected} />
      </div>
      <footer className="h-6 shrink-0 flex items-center gap-4 px-4 bg-panel border-t border-line font-mono text-[11px] text-slate-400">
        <span>Zoom {Math.round(view.k * 100)}%</span>
        <span>Cuadrícula {snapOn ? 'ON' : 'OFF'}</span>
        <span>{net.nodes.length} nodos · {net.pipes.length} tuberías</span>
        <span className="ml-auto">Rueda: zoom · Arrastrar fondo: mover · Ctrl+K: copiloto</span>
      </footer>
    </div>
  )
}
