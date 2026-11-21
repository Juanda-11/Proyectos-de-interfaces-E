/**
 * Almacén de la sesión en el navegador (o en la ventana de Electron): guarda el token y avisa
 * al resto de la aplicación cuando el servidor lo rechaza (401). Vive fuera de React para que
 * lo use también el cliente HTTP.
 */
const KEY = 'hydrograph-ai:token'
let memoryToken = null
let unauthorizedHandler = null

const read = (storage) => {
  try {
    return storage.getItem(KEY)
  } catch {
    return null // almacenamiento bloqueado
  }
}

/** Token de la sesión: primero el de esta ventana (sessionStorage) y luego el recordado en el equipo (localStorage). */
export function getToken() {
  return memoryToken || read(sessionStorage) || read(localStorage)
}

/**
 * Guarda el token. Por defecto la sesión termina al cerrar la pestaña o la aplicación, de modo que
 * al volver a abrirla se pide iniciar sesión; con `remember` se conserva en el equipo (hasta que caduque).
 */
export function setToken(token, { remember = false } = {}) {
  memoryToken = token
  clearToken({ keepMemory: true })
  try {
    ;(remember ? localStorage : sessionStorage).setItem(KEY, token)
  } catch {
    /* se conserva solo en memoria */
  }
}

export function clearToken({ keepMemory = false } = {}) {
  if (!keepMemory) memoryToken = null
  for (const storage of [sessionStorage, localStorage]) {
    try {
      storage.removeItem(KEY)
    } catch {
      /* nada que borrar */
    }
  }
}

/** Registra la función que se ejecuta cuando una petición protegida recibe 401. */
export function onUnauthorized(handler) {
  unauthorizedHandler = handler
  return () => {
    if (unauthorizedHandler === handler) unauthorizedHandler = null
  }
}
export const notifyUnauthorized = () => unauthorizedHandler?.()

/**
 * Lee los datos del token SIN verificar la firma (eso solo puede hacerlo el servidor).
 * Sirve para mostrar el nombre y para saber si ya caducó cuando no hay conexión.
 */
export function decodeToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    if (!payload.sub) return null
    return {
      user: { id: payload.sub, email: payload.email, name: payload.name },
      expired: typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now(),
    }
  } catch {
    return null
  }
}
