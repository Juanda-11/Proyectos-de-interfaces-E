import { makeSectors } from './network'
import { translate as t } from '../i18n'
import { pipeStatus, suggestDiameter } from './hydraulics'

/**
 * Respaldo local del copiloto para cuando el backend no está disponible.
 * Reproduce lo esencial: diseñar una red de n sectores y auditar velocidades.
 */

const MAX_SECTORS = 5

export function offlineDesign(prompt) {
  const n = Math.min(
    MAX_SECTORS,
    Math.max(1, parseInt(prompt.match(/(\d+)\s*sector/i)?.[1] ?? '3', 10)),
  )
  return {
    network: makeSectors(n),
    message: t('offline.designed', { n, pipes: n + 2 }),
  }
}

export function offlineAudit(net) {
  const bad = net.pipes.filter((p) => pipeStatus(p, true) === 'warn')
  if (!bad.length) return t('offline.auditOk')
  return t('offline.auditBad', {
    n: bad.length,
    ids: bad.map((p) => p.id).join(', '),
    dn: suggestDiameter(bad[0]),
  })
}

/** Sube a su diámetro sugerido los tramos con velocidad excesiva. */
export function offlineOptimize(net) {
  const changes = []
  const pipes = net.pipes.map((p) => {
    if (pipeStatus(p, true) !== 'warn') return p
    const to = suggestDiameter(p)
    changes.push({ type: 'diameter', elementId: p.id, from: p.diameter, to })
    return { ...p, diameter: to }
  })
  const message = changes.length
    ? t('offline.optimized', {
        n: changes.length,
        list: changes.map((c) => `${c.elementId} (DN${c.from}→DN${c.to})`).join(', '),
      })
    : t('offline.nothing')
  return { network: { ...net, pipes }, changes, message }
}

/** Interpreta la orden con palabras clave, igual que el backend. */
export function offlineCopilot(prompt, net) {
  if (/audit|presi|pressure|fuga|leak|revis|review|check|verific|diagn|anali/i.test(prompt))
    return { intent: 'audit', message: offlineAudit(net) }
  if (
    /dise|design|red\b|network|sector|genera|crea|arma|build|barrio|neighbou?rhood|district/i.test(
      prompt,
    )
  )
    return { intent: 'design', ...offlineDesign(prompt) }
  return {
    intent: 'help',
    message: t('offline.help'),
  }
}
