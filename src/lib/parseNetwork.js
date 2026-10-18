import { META } from './componentTypes'

const isNum = (v) => typeof v === 'number' && Number.isFinite(v)
const str = (v, fallback) => (typeof v === 'string' && v.trim() ? v : fallback)

/**
 * Valida y normaliza una red leída de un archivo o del almacenamiento local.
 * Devuelve `{ net }` o `{ error }` con un mensaje para el usuario.
 */
export function parseNetwork(data) {
  if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.pipes)) {
    return {
      error: 'El archivo no tiene el formato de una red HydroGraph (faltan «nodes» o «pipes»).',
    }
  }
  if (data.nodes.length > 200 || data.pipes.length > 400)
    return { error: 'La red es demasiado grande (máx. 200 nodos y 400 tuberías).' }

  const ids = new Set()
  const nodes = []
  for (const n of data.nodes) {
    if (!n || typeof n.id !== 'string' || !n.id) return { error: 'Hay un nodo sin identificador.' }
    if (!META[n.type]) return { error: `Tipo de componente desconocido: «${n.type}».` }
    if (!isNum(n.x) || !isNum(n.y))
      return { error: `El nodo ${n.id} no tiene coordenadas válidas.` }
    if (ids.has(n.id)) return { error: `Identificador de nodo repetido: ${n.id}.` }
    ids.add(n.id)
    nodes.push({ ...META[n.type].props, ...n, name: str(n.name, `${META[n.type].label} ${n.id}`) })
  }

  const pipeIds = new Set()
  const pipes = []
  for (const p of data.pipes) {
    if (!p || typeof p.id !== 'string' || !p.id || pipeIds.has(p.id))
      return { error: 'Hay una tubería sin identificador o repetida.' }
    if (!ids.has(p.from) || !ids.has(p.to) || p.from === p.to)
      return { error: `La tubería ${p.id} conecta nodos inexistentes.` }
    if (!isNum(p.diameter) || p.diameter <= 0 || !isNum(p.flow) || p.flow < 0)
      return { error: `La tubería ${p.id} tiene diámetro o caudal inválido.` }
    pipeIds.add(p.id)
    pipes.push({ id: p.id, from: p.from, to: p.to, diameter: p.diameter, flow: p.flow })
  }
  return { net: { nodes, pipes } }
}
