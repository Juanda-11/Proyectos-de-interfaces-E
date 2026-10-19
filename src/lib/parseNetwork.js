import { META } from './componentTypes'
import { translate as t } from '../i18n'

const isNum = (v) => typeof v === 'number' && Number.isFinite(v)
const str = (v, fallback) => (typeof v === 'string' && v.trim() ? v : fallback)

/**
 * Valida y normaliza una red leída de un archivo o del almacenamiento local.
 * Devuelve `{ net }` o `{ error }` con un mensaje para el usuario.
 */
export function parseNetwork(data) {
  if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.pipes)) {
    return {
      error: t('parse.format'),
    }
  }
  if (data.nodes.length > 200 || data.pipes.length > 400) return { error: t('parse.tooLarge') }

  const ids = new Set()
  const nodes = []
  for (const n of data.nodes) {
    if (!n || typeof n.id !== 'string' || !n.id) return { error: t('parse.nodeNoId') }
    if (!META[n.type]) return { error: t('parse.unknownType', { type: n.type }) }
    if (!isNum(n.x) || !isNum(n.y)) return { error: t('parse.badCoords', { id: n.id }) }
    if (ids.has(n.id)) return { error: t('parse.dupNode', { id: n.id }) }
    ids.add(n.id)
    nodes.push({ ...META[n.type].props, ...n, name: str(n.name, `${META[n.type].label} ${n.id}`) })
  }

  const pipeIds = new Set()
  const pipes = []
  for (const p of data.pipes) {
    if (!p || typeof p.id !== 'string' || !p.id || pipeIds.has(p.id))
      return { error: t('parse.pipeNoId') }
    if (!ids.has(p.from) || !ids.has(p.to) || p.from === p.to)
      return { error: t('parse.pipeNodes', { id: p.id }) }
    if (!isNum(p.diameter) || p.diameter <= 0 || !isNum(p.flow) || p.flow < 0)
      return { error: t('parse.pipeValues', { id: p.id }) }
    pipeIds.add(p.id)
    pipes.push({ id: p.id, from: p.from, to: p.to, diameter: p.diameter, flow: p.flow })
  }
  return { net: { nodes, pipes } }
}
