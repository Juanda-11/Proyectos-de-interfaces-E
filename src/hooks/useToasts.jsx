import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ToastContext = createContext(null)
const DURATION = 4500

/** Avisos efímeros (éxito, información, error) que se cierran solos. */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const push = useCallback(
    (text, type = 'info') => {
      const id = crypto.randomUUID()
      setToasts((t) => [...t.slice(-3), { id, text, type }])
      setTimeout(() => dismiss(id), DURATION)
    },
    [dismiss],
  )
  const api = useMemo(
    () => ({ info: (t) => push(t, 'info'), success: (t) => push(t, 'success'), error: (t) => push(t, 'error') }),
    [push],
  )
  return <ToastContext.Provider value={{ toasts, dismiss, ...api }}>{children}</ToastContext.Provider>
}

export function useToasts() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToasts debe usarse dentro de <ToastProvider>')
  return ctx
}
