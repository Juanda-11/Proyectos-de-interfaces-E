import { useEffect, useState } from 'react'
import { api } from '../api/client'

const POLL_MS = 60000

/**
 * Consulta periódicamente /api/health.
 * `state`: 'checking' | 'online' | 'offline'; `ai` indica el motor del copiloto ('rules' o el modelo).
 */
export function useBackendStatus() {
  const [status, setStatus] = useState({ state: 'checking', ai: null })
  useEffect(() => {
    let alive = true
    const check = () =>
      api.health().then(
        (h) => alive && setStatus({ state: 'online', ai: h.ai }),
        () => alive && setStatus({ state: 'offline', ai: null }),
      )
    check()
    const id = setInterval(check, POLL_MS)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])
  return status
}
