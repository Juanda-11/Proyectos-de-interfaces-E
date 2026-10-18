import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../api/client'
import { pipeStatus } from '../lib/hydraulics'

const DEBOUNCE_MS = 250

/**
 * Ejecuta la simulación en el backend mientras está activa y la repite (con retardo)
 * cada vez que cambia la red. Si el backend no responde, la interfaz sigue funcionando
 * con el cálculo local de velocidades (modo sin conexión).
 *
 * `status`: 'idle' | 'loading' | 'ok' | 'offline' | 'error'
 */
export function useSimulation(net, { onOffline, onError } = {}) {
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState(null)
  const [status, setStatus] = useState('idle')
  const callbacks = useRef({ onOffline, onError })
  const offline = useRef(false) // avisar solo al perder la conexión, no en cada recálculo
  useEffect(() => { callbacks.current = { onOffline, onError } })

  useEffect(() => {
    if (!running) return
    let cancelled = false
    const timer = setTimeout(async () => {
      setStatus('loading')
      try {
        const data = await api.simulate(net)
        if (cancelled) return
        offline.current = false
        setResult(data)
        setStatus('ok')
      } catch (err) {
        if (cancelled) return
        setResult(null)
        if (err.code === 'NETWORK' || err.code === 'TIMEOUT') {
          setStatus('offline')
          if (!offline.current) callbacks.current.onOffline?.(err)
          offline.current = true
        } else {
          setStatus('error')
          callbacks.current.onError?.(err)
        }
      }
    }, DEBOUNCE_MS)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [running, net])

  const start = useCallback(() => setRunning(true), [])
  const stop = useCallback(() => { offline.current = false; setRunning(false); setResult(null); setStatus('idle') }, [])
  const toggle = useCallback(() => (running ? stop() : start()), [running, start, stop])

  const pipeResults = useMemo(() => new Map((result?.pipes ?? []).map((p) => [p.id, p])), [result])
  const nodeResults = useMemo(() => new Map((result?.nodes ?? []).map((n) => [n.id, n])), [result])

  /** Estado de una tubería: del backend si hay resultado vigente; si no, cálculo local. */
  const statusOfPipe = useCallback(
    (pipe) => {
      if (!running) return 'idle'
      const r = pipeResults.get(pipe.id)
      return r ? r.status : pipeStatus(pipe, true)
    },
    [running, pipeResults],
  )

  const issues = useMemo(() => (result?.issues ?? []).filter((i) => i.severity !== 'info'), [result])
  const localWarnings = useMemo(() => net.pipes.filter((p) => pipeStatus(p, running) === 'warn'), [net.pipes, running])

  return {
    running, status, result, issues, start, stop, toggle,
    statusOfPipe,
    pipeResult: (id) => pipeResults.get(id) ?? null,
    nodeResult: (id) => nodeResults.get(id) ?? null,
    warningCount: result ? issues.length : localWarnings.length,
  }
}
