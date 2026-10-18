import { META } from './componentTypes'

/** Identificador corto y único dentro de una sesión de edición. */
export const newId = () => Math.random().toString(36).slice(2, 7)

const node = (id, type, x, y, name) => ({ id, type, x, y, name, ...META[type].props })
const pipe = (id, from, to, diameter, flow) => ({ id, from, to, diameter, flow })

/** Red demo: tanque -> bomba -> nodo -> n sectores (el último con tubería subdimensionada). */
export function makeSectors(n = 3) {
  const nodes = [
    node('T1', 'tank', 120, 300, 'Tanque T1'),
    node('P1', 'pump', 280, 300, 'Bomba B1'),
    node('J1', 'junction', 440, 300, 'Nodo J1'),
  ]
  const pipes = [pipe('a', 'T1', 'P1', 150, 4 * n), pipe('b', 'P1', 'J1', 150, 4 * n)]
  for (let i = 0; i < n; i++) {
    const id = `S${i + 1}`
    nodes.push(node(id, 'junction', 660, 300 + (i - (n - 1) / 2) * 120, `Sector ${i + 1}`))
    pipes.push(i === n - 1 ? pipe(`c${i}`, 'J1', id, 50, 8) : pipe(`c${i}`, 'J1', id, 100, 4))
  }
  return { nodes, pipes }
}
