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
import { useTheme } from './hooks/useTheme'
import { useToasts } from './hooks/useToasts'
import { useI18n } from './i18n/I18nProvider'
import { META } from './lib/componentTypes'
import { downloadBlob, downloadJSON } from './lib/download'
import { networkToSvg, svgToPngBlob } from './lib/exportImage'
import { buildReport } from './lib/report'
import { offlineCopilot, offlineOptimize } from './lib/offlineCopilot'
import { makeSectors, newId } from './lib/network'
import { parseNetwork } from './lib/parseNetwork'
import { loadNetwork, saveNetwork } from './lib/storage'

const MAX_IMPORT_BYTES = 1_000_000
const isOffline = (err) => ['NETWORK', 'TIMEOUT', 'NO_API'].includes(err.code)

export default function App() {
  const toast = useToasts()
  const { t } = useI18n()
  const { theme, toggle: toggleTheme } = useTheme()
  const { net, canUndo, canRedo, checkpoint, update, replace, undo, redo } = useNetworkHistory(
    () => loadNetwork() ?? makeSectors(3),
  )
  const [selected, setSelected] = useState(null) // { kind: 'node' | 'pipe', id }
  const [tool, setTool] = useState('select')
  const [view, setView] = useState({ x: 0, y: 0, k: 1 })
  const [snapOn, setSnapOn] = useState(true)
  const [gridOn, setGridOn] = useState(true)
  const [busy, setBusy] = useState(null) // 'optimize' | 'balance' | 'export'
  const [inspectorOpen, setInspectorOpen] = useState(true)
  const backend = useBackendStatus()
  const sim = useSimulation(net, {
    onOffline: () => toast.info(t('app.offlineSim')),
    onError: (err) => toast.error(t('app.simFailed', { msg: err.message })),
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
      toast.info(t('app.alreadyConnected'))
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
    toast.success(t('app.exportedJson'))
  }
  const importFile = async (file) => {
    if (file.size > MAX_IMPORT_BYTES) return toast.error(t('app.fileTooLarge'))
    let data
    try {
      data = JSON.parse(await file.text())
    } catch {
      return toast.error(t('app.invalidJson'))
    }
    const { net: next, error } = parseNetwork(data)
    if (error) return toast.error(error)
    load(next)
    sim.stop()
    toast.success(t('app.imported', { nodes: next.nodes.length, pipes: next.pipes.length }))
  }
  const diagram = () =>
    networkToSvg(net, { statusOfPipe: sim.statusOfPipe, nodeResult: sim.nodeResult, theme })
  const exportSVG = () => {
    downloadBlob(new Blob([diagram().svg], { type: 'image/svg+xml' }), 'hydrograph-red.svg')
    toast.success(t('app.exportedSvg'))
  }
  const exportPNG = async () => {
    try {
      const { svg, width, height } = diagram()
      downloadBlob(await svgToPngBlob(svg, width, height), 'hydrograph-red.png')
      toast.success(t('app.exportedPng'))
    } catch (err) {
      toast.error(t('app.imageFailed', { msg: err.message }))
    }
  }
  const exportReport = () => {
    const md = buildReport(net, { result: sim.result })
    downloadBlob(new Blob([md], { type: 'text/markdown;charset=utf-8' }), 'hydrograph-informe.md')
    toast.success(sim.result ? t('app.exportedReport') : t('app.exportedReportNoSim'))
  }
  const exportEpanet = async () => {
    setBusy('export')
    try {
      downloadBlob(await api.exportEpanet(net), 'hydrograph-red.inp')
      toast.success(t('app.exportedEpanet'))
    } catch (err) {
      toast.error(
        isOffline(err) ? t('app.epanetOffline') : t('app.exportFailed', { msg: err.message }),
      )
    } finally {
      setBusy(null)
    }
  }
  const newNetwork = () => {
    load(makeSectors(3))
    sim.stop()
    toast.info(t('app.exampleLoaded'))
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
        isOffline(err) ? t('app.balanceOffline') : t('app.balanceFailed', { msg: err.message }),
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
      toast.error(t('app.optimizeFailed', { msg: err.message }))
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
      if (error) throw new Error(t('app.invalidNetwork', { error }))
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
        k = e.key?.toLowerCase()
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
        theme={theme}
        onToggleTheme={toggleTheme}
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
            gridOn={gridOn}
            onToggleGrid={() => setGridOn((g) => !g)}
            onDragStart={checkpoint}
            onSelect={setSelected}
            onMove={(id, x, y) => updateNode(id, { x, y })}
            onNudge={nudgeNode}
            onConnect={connect}
          />
          <Legend running={sim.running} />
          <button
            onClick={() => setInspectorOpen((o) => !o)}
            aria-label={inspectorOpen ? t('app.hideInspector') : t('app.showInspector')}
            aria-pressed={inspectorOpen}
            title={inspectorOpen ? t('app.hideInspector') : t('app.showInspector')}
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
        <span>{t('footer.zoom', { pct: Math.round(view.k * 100) })}</span>
        <span>{gridOn ? t('footer.gridOn') : t('footer.gridOff')}</span>
        <span>{snapOn ? t('footer.snapOn') : t('footer.snapOff')}</span>
        <span>{t('footer.counts', { nodes: net.nodes.length, pipes: net.pipes.length })}</span>
        <BackendBadge {...backend} />
        <span className="ml-auto hidden xl:inline">{t('footer.hints')}</span>
      </footer>
      <Toasts />
    </div>
  )
}

const PROVIDERS = { gemini: 'Gemini', anthropic: 'Claude' }

function BackendBadge({ state, ai, provider }) {
  const { t } = useI18n()
  const engine =
    ai && ai !== 'rules'
      ? t('backend.ai', { provider: PROVIDERS[provider] ?? '', model: ai }).replace('  ', ' ')
      : t('backend.rules')
  const label = {
    checking: t('backend.checking'),
    online: t('backend.online', { engine }),
    offline: t('backend.offline'),
  }[state]
  const dot = { checking: 'bg-slate-500', online: 'bg-emerald-400', offline: 'bg-amber-400' }[state]
  return (
    <span className="inline-flex items-center gap-1.5">
      <i className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  )
}
