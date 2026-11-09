import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../api/client'
import { clearToken, decodeToken, getToken, onUnauthorized, setToken } from './session'

/**
 * Estado de la sesión. `status`:
 *  - 'loading'        comprobando el servidor y el token guardado
 *  - 'anonymous'      hay que iniciar sesión (o crear cuenta)
 *  - 'authenticated'  sesión iniciada
 *  - 'open'           el servidor tiene la autenticación desactivada: se entra directamente
 *  - 'local'          el usuario eligió trabajar sin cuenta ni servidor
 */
const AuthContext = createContext(null)
const UNREACHABLE = ['NETWORK', 'TIMEOUT', 'NO_API']
const isUnreachable = (err) => UNREACHABLE.includes(err?.code)

const INITIAL = { status: 'loading', user: null, server: null, reachable: true, expired: false }

export function AuthProvider({ children }) {
  const [state, setState] = useState(INITIAL)
  const run = useRef(0) // descarta resultados de comprobaciones antiguas
  const invalidate = useCallback(() => {
    run.current += 1
  }, [])

  const check = useCallback(async () => {
    const id = ++run.current
    const commit = (next) => id === run.current && setState((s) => ({ ...s, ...next }))

    let server = null
    let reachable = true
    try {
      server = (await api.health()).auth ?? null
    } catch {
      reachable = false
    }
    if (server && server.enabled === false) return commit({ status: 'open', server, reachable })

    const token = getToken()
    if (!token) return commit({ status: 'anonymous', server, reachable })

    if (reachable) {
      try {
        const { user } = await api.me()
        return commit({ status: 'authenticated', user, server, reachable })
      } catch (err) {
        if (!isUnreachable(err)) {
          clearToken() // 401 u otro rechazo: la sesión guardada ya no sirve
          return commit({ status: 'anonymous', user: null, server, reachable })
        }
        reachable = false
      }
    }
    // Sin conexión con el servidor: se acepta el token guardado mientras no haya caducado
    const decoded = decodeToken(token)
    if (decoded && !decoded.expired) {
      return commit({ status: 'authenticated', user: decoded.user, server, reachable })
    }
    clearToken()
    return commit({ status: 'anonymous', user: null, server, reachable, expired: true })
  }, [])

  useEffect(() => {
    check()
    // Cualquier petición protegida que reciba 401 cierra la sesión
    const off = onUnauthorized(() => {
      clearToken()
      setState((s) => ({ ...s, status: 'anonymous', user: null, expired: true }))
    })
    return () => {
      invalidate()
      off()
    }
  }, [check, invalidate])

  const open = useCallback(async (request) => {
    const { token, user } = await request()
    setToken(token)
    setState((s) => ({ ...s, status: 'authenticated', user, expired: false }))
    return user
  }, [])

  const value = useMemo(
    () => ({
      ...state,
      login: (email, password) => open(() => api.login(email, password)),
      register: (name, email, password) => open(() => api.register(name, email, password)),
      logout: () => {
        clearToken()
        setState((s) => ({ ...s, status: 'anonymous', user: null, expired: false }))
      },
      enterLocal: () => setState((s) => ({ ...s, status: 'local', user: null })),
      retry: () => {
        setState((s) => ({ ...s, status: 'loading' }))
        return check()
      },
    }),
    [state, open, check],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

const NO_PROVIDER = {
  status: 'open',
  user: null,
  server: null,
  reachable: true,
  expired: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  enterLocal: () => {},
  retry: async () => {},
}

/** Estado y acciones de la sesión. Fuera del proveedor se comporta como «sin autenticación». */
export function useAuth() {
  return useContext(AuthContext) ?? NO_PROVIDER
}
