import { API_TIMEOUT_MS, API_URL } from '../config'

/** Error de una petición al backend. `code` permite distinguir fallos de red de errores de validación. */
export class ApiError extends Error {
  constructor(message, { status = 0, code = 'NETWORK', details } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

const NO_API_STATUS = [404, 405, 502, 503, 504]

async function request(
  path,
  { method = 'POST', body, parse = 'json', timeoutMs = API_TIMEOUT_MS } = {},
) {
  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (err) {
    const timeout = err?.name === 'TimeoutError'
    throw new ApiError(
      timeout ? 'El servidor tardó demasiado en responder' : 'No se pudo conectar con el servidor',
      {
        code: timeout ? 'TIMEOUT' : 'NETWORK',
      },
    )
  }
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({}))
    // Respuesta que no es de nuestra API (p. ej. 404 de la plataforma): VITE_API_URL mal configurada o backend caído
    if (!error && NO_API_STATUS.includes(res.status)) {
      throw new ApiError(
        'No se encontró la API en esta dirección. Revisa que VITE_API_URL apunte al backend.',
        { status: res.status, code: 'NO_API' },
      )
    }
    throw new ApiError(error?.message ?? `Error ${res.status} del servidor`, {
      status: res.status,
      code: error?.code ?? 'HTTP_ERROR',
      details: error?.details,
    })
  }
  return parse === 'blob' ? res.blob() : res.json()
}

/** Solo se envía lo que el backend valida; el estado de la interfaz se queda fuera. */
const payload = ({ nodes, pipes }) => ({ nodes, pipes })

export const api = {
  health: () => request('/api/health', { method: 'GET', timeoutMs: 5000 }),
  simulate: (net) => request('/api/simulate', { body: payload(net) }),
  balance: (net) => request('/api/balance', { body: payload(net) }),
  optimize: (net) => request('/api/optimize', { body: payload(net) }),
  copilot: (prompt, net) => request('/api/copilot', { body: { prompt, network: payload(net) } }),
  exportEpanet: (net) => request('/api/export/epanet', { body: payload(net), parse: 'blob' }),
}
