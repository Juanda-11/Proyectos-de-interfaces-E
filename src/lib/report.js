import { META } from './componentTypes'
import { MAX_V, velocity } from './hydraulics'

const cell = (v) => String(v).replace(/\|/g, '\\|')
const row = (...cols) => `| ${cols.map(cell).join(' | ')} |`
const num = (v, d = 2) => (typeof v === 'number' ? v.toFixed(d) : '—')
const STATUS = {
  ok: 'Normal',
  warn: 'Velocidad excesiva',
  low: 'Presión baja',
  high: 'Presión alta',
  critical: 'Crítico',
  disconnected: 'Sin conexión',
}
const SEVERITY = { critical: 'Crítico', warning: 'Advertencia', info: 'Info' }

/**
 * Informe técnico en Markdown con los datos de la red y, si se simuló en el backend,
 * presiones, pérdidas de carga y problemas detectados.
 */
export function buildReport(net, { result = null, date = new Date() } = {}) {
  const pipeRes = new Map((result?.pipes ?? []).map((p) => [p.id, p]))
  const nodeRes = new Map((result?.nodes ?? []).map((n) => [n.id, n]))
  const nameOf = new Map(net.nodes.map((n) => [n.id, n.name]))
  const out = []

  out.push(
    '# Informe de red de suministro de agua',
    '',
    `Generado por HydroGraph AI el ${date.toLocaleDateString('es')}.`,
    '',
  )
  out.push('## Resumen', '')
  out.push(
    `- Componentes: ${net.nodes.length} (${net.nodes.filter((n) => n.type === 'tank').length} tanque(s), ${net.nodes.filter((n) => n.type === 'pump').length} bomba(s))`,
  )
  out.push(`- Tuberías: ${net.pipes.length}`)
  out.push(
    `- Demanda total: ${net.nodes.reduce((s, n) => s + (n.type === 'junction' ? (n.demand ?? 0) : 0), 0)} L/s`,
  )
  if (result) {
    const s = result.summary
    out.push(
      `- Estado: **${{ ok: 'estable', warning: 'con advertencias', critical: 'crítico' }[s.status]}**`,
    )
    out.push(`- Velocidad máxima: ${num(s.maxVelocity)} m/s (límite ${MAX_V} m/s)`)
    out.push(
      `- Presión mínima / máxima: ${num(s.minPressure, 1)} / ${num(s.maxPressure, 1)} m.c.a.`,
    )
    out.push(`- Pérdida de carga total del recorrido: ${num(s.totalHeadLoss)} m`)
  } else {
    out.push(
      '',
      '> No hay simulación del servidor: se muestran solo velocidades calculadas en local. Pulsa «Simular Flujo» antes de exportar para incluir presiones y pérdidas de carga.',
    )
  }

  out.push('', '## Tuberías', '')
  out.push(
    row(
      'Tramo',
      'DN (mm)',
      'Caudal (L/s)',
      'Velocidad (m/s)',
      'Longitud (m)',
      'Pérdida (m)',
      'Estado',
    ),
    row('---', '---:', '---:', '---:', '---:', '---:', '---'),
  )
  for (const p of net.pipes) {
    const r = pipeRes.get(p.id)
    const v = r?.velocity ?? velocity(p)
    out.push(
      row(
        `${nameOf.get(p.from)} → ${nameOf.get(p.to)}`,
        p.diameter,
        p.flow,
        num(v),
        r ? num(r.length, 1) : '—',
        r ? num(r.headLoss) : '—',
        v > MAX_V ? STATUS.warn : STATUS.ok,
      ),
    )
  }

  out.push('', '## Componentes', '')
  out.push(
    row('Nombre', 'Tipo', 'Cota (m)', 'Demanda (L/s)', 'Presión (m.c.a.)', 'Estado'),
    row('---', '---', '---:', '---:', '---:', '---'),
  )
  for (const n of net.nodes) {
    const r = nodeRes.get(n.id)
    out.push(
      row(
        n.name,
        META[n.type].label,
        n.elevation,
        n.type === 'junction' ? (n.demand ?? 0) : '—',
        num(r?.pressure, 1),
        r ? STATUS[r.status] : '—',
      ),
    )
  }

  if (result) {
    out.push('', '## Problemas detectados', '')
    if (!result.issues.length) out.push('Sin problemas.')
    for (const i of result.issues)
      out.push(
        `- **${SEVERITY[i.severity]}**: ${i.message}${i.suggestion ? ` ${i.suggestion}` : ''}`,
      )
  }

  out.push(
    '',
    '## Criterios',
    '',
    `- Velocidad máxima recomendada: ${MAX_V} m/s; mínima para evitar sedimentación: 0,3 m/s.`,
    '- Presión de servicio: 10–70 m.c.a.',
    '- Pérdida por fricción: Hazen-Williams (C = 130).',
    '',
  )
  return out.join('\n')
}
