import { useEffect, useRef, useState } from 'react'
import { ChevronDown, FilePlus2, FileUp, FileDown, FileCode2 } from 'lucide-react'

function Item({ icon: Icon, onClick, children }) {
  return (
    <li role="none">
      <button
        role="menuitem"
        onClick={onClick}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-white/10 text-left"
      >
        <Icon size={15} className="text-sky-400" /> {children}
      </button>
    </li>
  )
}

/** Menú «Archivo»: nueva red, importar y exportar (JSON propio o EPANET). */
export default function FileMenu({ onNew, onImport, onExportJSON, onExportEpanet, busy }) {
  const [open, setOpen] = useState(false)
  const root = useRef(null)
  const [fileInput, setFileInput] = useState(null) // ref como estado: se usa solo en manejadores

  useEffect(() => {
    if (!open) return
    const outside = (e) => !root.current?.contains(e.target) && setOpen(false)
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  const run = (fn) => () => {
    setOpen(false)
    fn()
  }

  return (
    <div ref={root} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={Boolean(busy)}
        className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm border border-line text-slate-300 hover:bg-white/5 disabled:opacity-50 transition"
      >
        Archivo <ChevronDown size={14} />
      </button>
      {open && (
        <ul
          role="menu"
          className="rise absolute right-0 mt-1.5 w-56 p-1 rounded-xl bg-panel border border-line shadow-xl z-40"
        >
          <Item icon={FilePlus2} onClick={run(onNew)}>
            Nueva red de ejemplo
          </Item>
          <Item icon={FileUp} onClick={run(() => fileInput?.click())}>
            Importar JSON…
          </Item>
          <Item icon={FileDown} onClick={run(onExportJSON)}>
            Exportar JSON
          </Item>
          <Item icon={FileCode2} onClick={run(onExportEpanet)}>
            Exportar a EPANET (.inp)
          </Item>
        </ul>
      )}
      <input
        ref={setFileInput}
        type="file"
        accept=".json,application/json"
        hidden
        aria-label="Importar red desde archivo JSON"
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (f) onImport(f)
        }}
      />
    </div>
  )
}
