import { META } from './componentTypes'
import { MAX_V, velocity } from './hydraulics'
import { getLanguage, translate as t } from '../i18n'

const cell = (v) => String(v).replace(/\|/g, '\\|')
const row = (...cols) => `| ${cols.map(cell).join(' | ')} |`
const num = (v, d = 2) => (typeof v === 'number' ? v.toFixed(d) : '—')
const status = (key) => t(`report.status.${key}`)

/**
 * Informe técnico en Markdown (en el idioma activo) con los datos de la red y, si se simuló
 * en el backend, presiones, pérdidas de carga y problemas detectados.
 */
export function buildReport(net, { result = null, date = new Date() } = {}) {
  const pipeRes = new Map((result?.pipes ?? []).map((p) => [p.id, p]))
  const nodeRes = new Map((result?.nodes ?? []).map((n) => [n.id, n]))
  const nameOf = new Map(net.nodes.map((n) => [n.id, n.name]))
  const count = (type) => net.nodes.filter((n) => n.type === type).length
  const demand = net.nodes.reduce((s, n) => s + (n.type === 'junction' ? (n.demand ?? 0) : 0), 0)
  const pu = t('unit.pressure')
  const out = []

  out.push(
    `# ${t('report.title')}`,
    '',
    t('report.generated', { date: date.toLocaleDateString(getLanguage()) }),
    '',
  )
  out.push(`## ${t('report.summary')}`, '')
  out.push(
    `- ${t('report.components')}: ${net.nodes.length} (${t('report.tanksPumps', { tanks: count('tank'), pumps: count('pump') })})`,
  )
  out.push(`- ${t('report.pipes')}: ${net.pipes.length}`)
  out.push(`- ${t('report.totalDemand')}: ${demand} L/s`)
  if (result) {
    const s = result.summary
    out.push(`- ${t('report.state')}: **${t(`report.summaryStatus.${s.status}`)}**`)
    out.push(`- ${t('report.maxVelocity', { max: MAX_V })}: ${num(s.maxVelocity)} m/s`)
    out.push(
      `- ${t('report.pressureRange')}: ${num(s.minPressure, 1)} / ${num(s.maxPressure, 1)} ${pu}`,
    )
    out.push(`- ${t('report.totalHeadLoss')}: ${num(s.totalHeadLoss)} m`)
  } else {
    out.push('', `> ${t('report.noSimulation')}`)
  }

  out.push('', `## ${t('report.pipes')}`, '')
  out.push(
    row(
      t('report.col.pipe'),
      'DN (mm)',
      `${t('report.col.flow')} (L/s)`,
      `${t('report.col.velocity')} (m/s)`,
      `${t('report.col.length')} (m)`,
      `${t('report.col.loss')} (m)`,
      t('report.col.status'),
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
        v > MAX_V ? status('warn') : status('ok'),
      ),
    )
  }

  out.push('', `## ${t('report.components')}`, '')
  out.push(
    row(
      t('report.col.name'),
      t('report.col.type'),
      `${t('report.col.elevation')} (m)`,
      `${t('report.col.demand')} (L/s)`,
      `${t('report.col.pressure')} (${pu})`,
      t('report.col.status'),
    ),
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
        r ? status(r.status) : '—',
      ),
    )
  }

  if (result) {
    out.push('', `## ${t('report.issues')}`, '')
    if (!result.issues.length) out.push(t('report.noIssues'))
    for (const i of result.issues)
      out.push(
        `- **${t(`report.severity.${i.severity}`)}**: ${i.message}${i.suggestion ? ` ${i.suggestion}` : ''}`,
      )
  }

  out.push(
    '',
    `## ${t('report.criteria')}`,
    '',
    `- ${t('report.criteriaVelocity', { max: MAX_V })}`,
    `- ${t('report.criteriaPressure', { unit: pu })}`,
    `- ${t('report.criteriaLoss')}`,
    '',
  )
  return out.join('\n')
}
