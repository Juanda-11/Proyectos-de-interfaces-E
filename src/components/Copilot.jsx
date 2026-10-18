import { useEffect, useRef, useState } from 'react'
import { Sparkles, X, CornerDownLeft } from 'lucide-react'

const SUGGESTIONS = ['Diseñar red para 3 sectores', 'Auditar presiones de la red']

export default function Copilot({ onGenerate, onAudit }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [msgs, setMsgs] = useState([])
  const input = useRef(null)
  const end = useRef(null)

  useEffect(() => {
    const key = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen((o) => !o) }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])
  useEffect(() => { if (open) input.current?.focus() }, [open])
  useEffect(() => end.current?.scrollIntoView({ behavior: 'smooth' }), [msgs, loading])

  const submit = (q = text) => {
    q = q.trim()
    if (!q || loading) return
    setMsgs((m) => [...m, { role: 'user', t: q }])
    setText(''); setLoading(true)
    setTimeout(() => { // simula la latencia del modelo
      const reply = /audit|presi|fuga|revis/i.test(q) ? onAudit()
        : /dise|red|sector|genera/i.test(q) ? onGenerate(q)
        : 'Puedo diseñar redes ("Diseñar red para 3 sectores") o auditarlas ("Auditar presiones").'
      setMsgs((m) => [...m, { role: 'ai', t: reply }]); setLoading(false)
    }, 1800)
  }

  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 pl-4 pr-3 h-11 rounded-full bg-ai text-white text-sm font-medium shadow-[0_0_28px_rgba(139,92,246,.55)] hover:scale-105 active:scale-95 transition">
        <Sparkles size={16} /> Copiloto IA
        <kbd className="ml-1 px-1.5 py-0.5 rounded bg-black/25 text-[11px] font-mono">Ctrl K</kbd>
      </button>
    )

  return (
    <div className="rise absolute bottom-6 left-1/2 -translate-x-1/2 w-[640px] max-w-[92%] rounded-2xl p-[1.5px] bg-ai shadow-[0_0_44px_rgba(139,92,246,.45)]">
      <div className="rounded-2xl bg-app/95 backdrop-blur-xl">
        {(msgs.length > 0 || loading) && (
          <div className="max-h-52 overflow-y-auto p-4 space-y-3 text-sm border-b border-line">
            {msgs.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'text-right' : ''}>
                <span className={`inline-block max-w-[85%] px-3 py-2 rounded-xl text-left ${m.role === 'user' ? 'bg-panel text-slate-200' : 'bg-violet-500/15 text-violet-100 border border-violet-400/20'}`}>{m.t}</span>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-3 text-violet-300">
                <span className="flex gap-1">{[0, 1, 2].map((i) => <i key={i} className="w-1.5 h-1.5 rounded-full bg-ai animate-bounce" style={{ animationDelay: `${i * 120}ms` }} />)}</span>
                Copiloto analizando la red…
              </div>
            )}
            <div ref={end} />
          </div>
        )}
        <div className="flex items-center gap-3 px-4 h-14">
          <Sparkles size={18} className="text-fuchsia-400 shrink-0" />
          <input
            ref={input} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder='Escribe una orden, p. ej. "Diseñar red para 3 sectores"' disabled={loading}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-500"
          />
          <CornerDownLeft size={15} className="text-slate-500" />
          <button onClick={() => setOpen(false)} title="Cerrar (Esc)" className="text-slate-400 hover:text-white"><X size={16} /></button>
        </div>
        {msgs.length === 0 && (
          <div className="flex gap-2 px-4 pb-3">
            {SUGGESTIONS.map((s) => <button key={s} onClick={() => submit(s)} className="px-2.5 py-1 rounded-full text-xs border border-violet-400/30 text-violet-200 hover:bg-violet-500/15 transition">{s}</button>)}
          </div>
        )}
      </div>
    </div>
  )
}
