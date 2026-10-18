import { parseNetwork } from './parseNetwork'

const KEY = 'hydrograph-ai:network:v1'

/** Lee la última red guardada; devuelve null si no hay o está dañada (o si el navegador bloquea el almacenamiento). */
export function loadNetwork() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (parseNetwork(JSON.parse(raw)).net ?? null) : null
  } catch {
    return null
  }
}

export function saveNetwork(net) {
  try {
    localStorage.setItem(KEY, JSON.stringify(net))
    return true
  } catch {
    return false
  }
}

export function clearNetwork() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* sin almacenamiento disponible: no hay nada que borrar */
  }
}
