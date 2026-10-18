import { CheckCircle2, Info, OctagonAlert, X } from 'lucide-react'
import { useToasts } from '../hooks/useToasts'

const STYLE = {
  info: ['border-sky-400/30 text-sky-100', Info, 'text-sky-400'],
  success: ['border-emerald-400/30 text-emerald-100', CheckCircle2, 'text-emerald-400'],
  error: ['border-red-400/40 text-red-100', OctagonAlert, 'text-red-400'],
}

export default function Toasts() {
  const { toasts, dismiss } = useToasts()
  return (
    <div
      className="fixed top-14 right-4 z-50 flex flex-col gap-2 w-80 pointer-events-none"
      aria-live="polite"
    >
      {toasts.map(({ id, text, type }) => {
        const [box, Icon, tint] = STYLE[type]
        return (
          <div
            key={id}
            role={type === 'error' ? 'alert' : 'status'}
            className={`rise pointer-events-auto flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-panel/95 backdrop-blur border text-sm shadow-lg ${box}`}
          >
            <Icon size={16} className={`mt-0.5 shrink-0 ${tint}`} />
            <span className="flex-1">{text}</span>
            <button
              onClick={() => dismiss(id)}
              aria-label="Cerrar aviso"
              className="text-slate-400 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
