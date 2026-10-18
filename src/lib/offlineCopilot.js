import { makeSectors } from './network'
import { pipeStatus, suggestDiameter } from './hydraulics'

/**
 * Respaldo local del copiloto para cuando el backend no está disponible.
 * Reproduce lo esencial: diseñar una red de n sectores y auditar velocidades.
 */

const MAX_SECTORS = 5

export function offlineDesign(prompt) {
  const n = Math.min(MAX_SECTORS, Math.max(1, parseInt(prompt.match(/(\d+)\s*sector/i)?.[1] ?? '3', 10)))
  return {
    network: makeSectors(n),
    message: `Red generada sin conexión: 1 tanque, 1 bomba y ${n} sectores con ${n + 2} tuberías. Pulsa "Simular Flujo" para verificar velocidades.`,
  }
}

export function offlineAudit(net) {
  const bad = net.pipes.filter((p) => pipeStatus(p, true) === 'warn')
  if (!bad.length) return 'Auditoría local completa: velocidades dentro de rango. (Sin conexión no se calculan presiones.)'
  return `Detecté ${bad.length} tramo(s) con velocidad sobre 2.5 m/s (${bad.map((p) => p.id).join(', ')}). Selecciónalo y aplica el diámetro sugerido (DN${suggestDiameter(bad[0])}).`
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
    ? `Ajusté ${changes.length} diámetro(s) sin conexión: ${changes.map((c) => `${c.elementId} (DN${c.from}→DN${c.to})`).join(', ')}.`
    : 'La red ya cumple los criterios de velocidad; no hay nada que optimizar.'
  return { network: { ...net, pipes }, changes, message }
}

/** Interpreta la orden con palabras clave, igual que el backend. */
export function offlineCopilot(prompt, net) {
  if (/audit|presi|fuga|revis|verific|diagn|anali/i.test(prompt)) return { intent: 'audit', message: offlineAudit(net) }
  if (/dise|red|sector|genera|crea|arma|barrio/i.test(prompt)) return { intent: 'design', ...offlineDesign(prompt) }
  return { intent: 'help', message: 'Puedo diseñar redes ("Diseñar red para 3 sectores") o auditarlas ("Auditar presiones").' }
}
