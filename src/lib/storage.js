import { parseNetwork } from './parseNetwork'

const PREFIX = 'hydrograph-ai:network:v1'
const LEGACY_KEY = PREFIX // antes de las cuentas, la red se guardaba sin identificar al usuario

/**
 * La red se guarda por usuario (`scope` = id de la cuenta, o «local» sin cuenta) para que en un
 * equipo compartido cada persona vea solo su trabajo.
 */
const keyFor = (scope) => `${PREFIX}:${scope}`

/** Lee la última red guardada; devuelve null si no hay o está dañada (o si el navegador bloquea el almacenamiento). */
export function loadNetwork(scope = 'local') {
  try {
    // La red anterior a las cuentas se hereda solo en el modo local, nunca en una cuenta
    const raw =
      localStorage.getItem(keyFor(scope)) ??
      (scope === 'local' ? localStorage.getItem(LEGACY_KEY) : null)
    return raw ? (parseNetwork(JSON.parse(raw)).net ?? null) : null
  } catch {
    return null
  }
}

export function saveNetwork(net, scope = 'local') {
  try {
    localStorage.setItem(keyFor(scope), JSON.stringify(net))
    return true
  } catch {
    return false
  }
}

export function clearNetwork(scope = 'local') {
  try {
    localStorage.removeItem(keyFor(scope))
    if (scope === 'local') localStorage.removeItem(LEGACY_KEY)
  } catch {
    /* sin almacenamiento disponible: no hay nada que borrar */
  }
}
