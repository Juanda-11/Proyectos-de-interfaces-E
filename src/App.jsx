import { useEffect, useRef, useState } from 'react'
import { PanelRightClose, PanelRightOpen } from 'lucide-react'
import TopBar from './components/TopBar'
import Toolbar from './components/Toolbar'
import Canvas from './components/Canvas'
import Inspector from './components/Inspector'
import Copilot from './components/Copilot'
import Toasts from './components/Toasts'
import Legend from './components/Legend'
import { api } from './api/client'
import { useBackendStatus } from './hooks/useBackendStatus'
import { useNetworkHistory } from './hooks/useNetworkHistory'
import { useSimulation } from './hooks/useSimulation'
import { useToasts } from './hooks/useToasts'
import { META } from './lib/componentTypes'
import { downloadBlob, downloadJSON } from './lib/download'
import { networkToSvg, svgToPngBlob } from './lib/exportImage'
import { buildReport } from './lib/report'
import { offlineCopilot, offlineOptimize } from './lib/offlineCopilot'
import { makeSectors, newId } from './lib/network'
import { parseNetwork } from './lib/parseNetwork'
import { loadNetwork, saveNetwork } from './lib/storage'

const MAX_IMPORT_BYTES = 1_000_000
const isOffline = (err) => err.code === 'NETWORK' || err.code === 'TIMEOUT'

export default function App() {
  const toast = useToasts()
  const { net, canUndo, canRedo, checkpoint, update, replace, undo, redo } = useNetworkHistory(
    () => loadNetwork() ?? makeSectors(3),
  )
  const [selected, setSelected] = useState(null) // { kind: 'node' | 'pipe', id }
  const [tool, setTool] = useState('select')
  const [view, setView] = useState({ x: 0, y: 0, k: 1 })
  const [snapOn, setSnapOn] = useState(true)
  const [busy, setBusy] = useState(null) // 'optimize' | 'balance' | 'export'
  const [inspectorOpen, setInspectorOpen] = useState(true)
  const backend = useBackendStatus()
  const sim = useSimulation(net, {
    onOffline: () =>
      toast.info('Sin conexión con el servidor: se calculan solo las velocidades en local.'),
    onError: (err) => toast.error(`No se pudo simular: ${err.message}`),
  })

  // Guardado automático (con retardo para no escribir en cada fotograma de un arrastre)
  useEffect(() => {
    const id = setTimeout(() => saveNetwork(net), 400)
    return () => clearTimeout(id)
  }, [net])

  // --- Edición de la red ---
  const addNode = (type) => {
    checkpoint()
    const n = net.nodes.filter((x) => x.type === type).length + 1
    const id = type[0].toUpperCase() + newId()
    const node = {
      id,
      type,
      x: 200 + (net.nodes.length % 8) * 40,
      y: 80 + (net.nodes.length % 6) * 40,
      name: `${META[type].label} ${n}`,
      ...META[type].props,
    }
    update((s) => ({ ...s, nodes: [...s.nodes, node] }))
    setSelected({ kind: 'node', id })
    setTool('select')
  }
  const updateNode = (id, patch) =>
    update((s) => ({ ...s, nodes: s.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)) }))
  const updatePipe = (id, patch) =>
    update((s) => ({ ...s, pipes: s.pipes.map((p) => (p.id === id ? { ...p, ...patch } : p)) }))
  const nudgeNode = (id, x, y) => {
    checkpoint()
    updateNode(id, { x, y })
  }
  const connect = (from, to) => {
    if (
      net.pipes.some((p) => (p.from === from && p.to === to) || (p.from === to && p.to === from))
    ) {
      toast.info('Esos dos componentes ya están conectados.')
      return
    }
    checkpoint()
    const id = 'p' + newId()
    update((s) => ({ ...s, pipes: [...s.pipes, { id, from, to, diameter: 100, flow: 4 }] }))
    setSelected({ kind: 'pipe', id })
    setTool('select')
  }
  const remove = () => {
    if (!selected) return
    checkpoint()
    update((s) =>
      selected.kind === 'node'
        ? {
            nodes: s.nodes.filter((n) => n.id !== selected.id),
            pipes: s.pipes.filter((p) => p.from !== selected.id && p.to !== selected.id),
          }
        : { ...s, pipes: s.pipes.filter((p) => p.id !== selected.id) },
    )
    setSelected(null)
  }
  const load = (next, { record = true } = {}) => {
    replace(next, { record })
    setSelected(null)
  }

  // --- Archivos ---
  const exportJSON = () => {
    downloadJSON(net, 'hydrograph-red.json')
    toast.success('Red exportada como hydrograph-red.json')
  }
  const importFile = async (file) => {
    if (file.size > MAX_IMPORT_BYTES)
      return toast.error('El archivo es demasiado grande (máx. 1 MB).')
    let data
    try {
      data = JSON.parse(await file.text())
    } catch {
      return toast.error('El archivo no es un JSON válido.')
    }
    const { net: next, error } = parseNetwork(data)
    if (error) return toast.error(error)
    load(next)
    sim.stop()
    toast.success(
      `Red importada: ${next.nodes.length} componentes y ${next.pipes.length} tuberías.`,
    )
  }
  const diagram = () =>
    networkToSvg(net, { statusOfPipe: sim.statusOfPipe, nodeResult: sim.nodeResult })
  const exportSVG = () => {
    downloadBlob(new Blob([diagram().svg], { type: 'image/svg+xml' }), 'hydrograph-red.svg')
    toast.success('Diagrama exportado como hydrograph-red.svg')
  }
  const exportPNG = async () => {
    try {
      const { svg, width, height } = diagram()
      downloadBlob(await svgToPngBlob(svg, width, height), 'hydrograph-red.png')
      toast.success('Diagrama exportado como hydrograph-red.png')
    } catch (err) {
      toast.error(`No se pudo exportar la imagen: ${err.message}`)
    }
  }
  const exportReport = () => {
    const md = buildReport(net, { result: sim.result })
    downloadBlob(new Blob([md], { type: 'text/markdown;charset=utf-8' }), 'hydrograph-informe.md')
    toast.success(
      sim.result
        ? 'Informe exportado como hydrograph-informe.md'
        : 'Informe exportado sin presiones: simula antes para incluirlas.',
    )
  }
  const exportEpanet = async () => {
    setBusy('export')
    try {
      downloadBlob(await api.exportEpanet(net), 'hydrograph-red.inp')
      toast.success('Red exportada a EPANET (hydrograph-red.inp).')
    } catch (err) {
      toast.error(
        isOffline(err)
          ? 'Exportar a EPANET requiere conexión con el servidor.'
          : `No se pudo exportar: ${err.message}`,
      )
    } finally {
      setBusy(null)
    }
  }
  const newNetwork = () => {
    load(makeSectors(3))
    sim.stop()
    toast.info('Red de ejemplo cargada. Puedes deshacer con Ctrl+Z.')
  }

  // --- IA ---
  const balance = async () => {
    setBusy('balance')
    try {
      const r = await api.balance(net)
      if (r.changes.length) load(parseNetwork(r.network).net ?? r.network)
      sim.start()
      toast[r.changes.length ? 'success' : 'info'](r.message)
    } catch (err) {
      toast.error(
        isOffline(err)
          ? 'Calcular caudales requiere conexión con el servidor.'
          : `No se pudo balancear: ${err.message}`,
      )
    } finally {
      setBusy(null)
    }
  }

  const optimize = async () => {
    setBusy('optimize')
    try {
      let r
      try {
        r = await api.optimize(net)
      } catch (err) {
        if (!isOffline(err)) throw err
        r = offlineOptimize(net)
      }
      if (r.changes.length) load(parseNetwork(r.network).net ?? r.network)
      sim.start()
      toast[r.changes.length ? 'success' : 'info'](r.message)
    } catch (err) {
      toast.error(`No se pudo optimizar: ${err.message}`)
    } finally {
      setBusy(null)
    }
  }

  const askCopilot = async (prompt) => {
    let r
    try {
      r = await api.copilot(prompt, net)
    } catch (err) {
      if (!isOffline(err)) throw err
      r = { ...offlineCopilot(prompt, net), source: 'rules' }
    }
    if (r.intent === 'design' && r.network) {
      const { net: next, error } = parseNetwork(r.network)
      if (error) throw new Error(`El servidor devolvió una red inválida: ${error}`)
      load(next)
      sim.stop()
    } else if (r.intent === 'audit') {
      sim.start()
    }
    return { message: r.message, source: r.source }
  }

  // --- Atajos: Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z / Supr / Esc ---
  const shortcuts = useRef({})
  useEffect(() => {
    shortcuts.current = {
      undo,
      redo,
      remove,
      deselect: () => {
        setSelected(null)
        setTool('select')
      },
    }
  })
  useEffect(() => {
    const key = (e) => {
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)
      const isRange = typing && e.target.type === 'range'
      const mod = e.ctrlKey || e.metaKey,
        k = e.key.toLowerCase()
      const s = shortcuts.current
      if (mod && (k === 'z' || k === 'y')) {
        if (typing && !isRange) return // deja el deshacer nativo de los campos de texto
        e.preventDefault()
        k === 'y' || e.shiftKey ? s.redo() : s.undo()
      } else if (!typing && (e.key === 'Delete' || e.key === 'Backspace')) s.remove()
      else if (e.key === 'Escape' && !typing) s.deselect()
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])

  return (
    <div className="h-full flex flex-col">
      <TopBar
        running={sim.running}
        status={sim.status}
        warnings={sim.warningCount}
        busy={busy}
        onToggle={sim.toggle}
        onOptimize={optimize}
        onBalance={balance}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onNew={newNetwork}
        onImport={importFile}
        onExportJSON={exportJSON}
        onExportEpanet={exportEpanet}
        onExportSVG={exportSVG}
        onExportPNG={exportPNG}
        onExportReport={exportReport}
      />
      <div className="flex flex-1 min-h-0">
        <Toolbar tool={tool} onTool={setTool} onAdd={addNode} />
        <main className="relative flex-1 overflow-hidden">
          <Canvas
            nodes={net.nodes}
            pipes={net.pipes}
            selected={selected}
            tool={tool}
            running={sim.running}
            statusOfPipe={sim.statusOfPipe}
            nodeResult={sim.nodeResult}
            view={view}
            onView={setView}
            snapOn={snapOn}
            onToggleSnap={() => setSnapOn((s) => !s)}
            onDragStart={checkpoint}
            onSelect={setSelected}
            onMove={(id, x, y) => updateNode(id, { x, y })}
            onNudge={nudgeNode}
            onConnect={connect}
          />
          <Legend running={sim.running} />
          <button
            onClick={() => setInspectorOpen((o) => !o)}
            aria-label={inspectorOpen ? 'Ocultar inspector' : 'Mostrar inspector'}
            aria-pressed={inspectorOpen}
            title={inspectorOpen ? 'Ocultar inspector' : 'Mostrar inspector'}
            className="absolute top-3 right-4 w-8 h-8 grid place-items-center rounded-lg bg-panel/90 border border-line text-slate-300 hover:bg-white/10 transition"
          >
            {inspectorOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
          </button>
          <Copilot onSubmit={askCopilot} />
        </main>
        {inspectorOpen && (
          <Inspector
            net={net}
            selected={selected}
            running={sim.running}
            simulation={sim}
            onNode={updateNode}
            onPipe={updatePipe}
            onDelete={remove}
            onCommit={checkpoint}
            onSelect={setSelected}
          />
        )}
      </div>
      <footer className="h-6 shrink-0 flex items-center gap-4 px-4 bg-panel border-t border-line font-mono text-[11px] text-slate-400">
        <span>Zoom {Math.round(view.k * 100)}%</span>
        <span>Cuadrícula {snapOn ? 'ON' : 'OFF'}</span>
        <span>
          {net.nodes.length} nodos · {net.pipes.length} tuberías
        </span>
        <BackendBadge {...backend} />
        <span className="ml-auto hidden xl:inline">
          Rueda: zoom · Arrastrar fondo: mover · Flechas: mover nodo · Ctrl+K: copiloto
        </span>
      </footer>
      <Toasts />
    </div>
  )
}

const PROVIDERS = { gemini: 'Gemini', anthropic: 'Claude' }

function BackendBadge({ state, ai, provider }) {
  const label = {
    checking: 'Conectando…',
    online: `Servidor conectado · ${ai && ai !== 'rules' ? `IA ${PROVIDERS[provider] ?? ''} ${ai}`.replace('  ', ' ') : 'copiloto por reglas'}`,
    offline: 'Sin servidor · modo local',
  }[state]
  const dot = { checking: 'bg-slate-500', online: 'bg-emerald-400', offline: 'bg-amber-400' }[state]
  return (
    <span className="inline-flex items-center gap-1.5">
      <i className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  )
}
