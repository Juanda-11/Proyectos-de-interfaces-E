import { Droplets, Play, Square, CheckCircle2, AlertTriangle, Undo2, Redo2, Wand2, Loader2, WifiOff } from 'lucide-react'
import FileMenu from './FileMenu'

export default function TopBar({
  running, status, warnings, onToggle, onOptimize, busy,
  canUndo, canRedo, onUndo, onRedo, ...files
}) {
  const warn = warnings > 0
  return (
    <header className="h-12 shrink-0 flex items-center gap-4 px-4 bg-panel border-b border-line">
      <div className="flex items-center gap-2">
        <span className="grid place-items-center w-7 h-7 rounded-lg bg-water shadow-[0_0_14px_rgba(14,165,233,.5)]">
          <Droplets size={16} className="text-white" />
        </span>
        <h1 className="text-sm font-semibold">HydroGraph AI</h1>
        <span className="text-xs text-slate-400 hidden lg:inline">· Red_Distribución_01.hgraph</span>
      </div>

      <span
        role="status"
        className={`ml-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
          warn ? 'bg-danger text-white border-transparent alert' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
        }`}
      >
        {warn ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
        {warn ? `${warnings} advertencia${warnings > 1 ? 's' : ''}` : running ? 'Red estable · simulando' : 'Red estable'}
      </span>
      {running && status === 'offline' && (
        <span className="inline-flex items-center gap-1.5 text-xs text-amber-300" title="Sin conexión con el servidor: solo se calculan velocidades">
          <WifiOff size={13} /> Modo local
        </span>
      )}

      <div className="ml-auto flex items-center gap-2">
        <div className="flex mr-1 rounded-lg border border-line overflow-hidden">
          {[[Undo2, 'Deshacer (Ctrl+Z)', onUndo, canUndo], [Redo2, 'Rehacer (Ctrl+Y)', onRedo, canRedo]].map(([Icon, t, fn, on]) => (
            <button key={t} title={t} aria-label={t} onClick={fn} disabled={!on} className="w-8 h-8 grid place-items-center text-slate-300 hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition"><Icon size={15} /></button>
          ))}
        </div>
        <FileMenu busy={busy} {...files} />
        <button onClick={onOptimize} disabled={busy} title="Corrige diámetros y alturas de bomba automáticamente" className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm border border-violet-400/40 text-violet-200 hover:bg-violet-500/15 disabled:opacity-50 transition">
          {busy === 'optimize' ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />} Optimizar
        </button>
        <button
          onClick={onToggle}
          className={`flex items-center gap-1.5 px-4 h-8 rounded-lg text-sm font-medium text-white transition hover:-translate-y-px active:scale-95 ${
            running ? 'bg-slate-600' : 'bg-water shadow-[0_0_16px_rgba(14,165,233,.45)]'
          }`}
        >
          {running ? (status === 'loading' ? <Loader2 size={14} className="animate-spin" /> : <Square size={14} />) : <Play size={14} />}
          {running ? 'Detener' : 'Simular Flujo'}
        </button>
      </div>
    </header>
  )
}
