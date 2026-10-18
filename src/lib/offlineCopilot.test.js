import { describe, it, expect } from 'vitest'
import { offlineAudit, offlineCopilot, offlineDesign, offlineOptimize } from './offlineCopilot'
import { makeSectors } from './network'
import { pipeStatus } from './hydraulics'

describe('offlineDesign', () => {
  it('lee el número de sectores y lo limita a 1-5', () => {
    expect(offlineDesign('red para 4 sectores').network.nodes).toHaveLength(7)
    expect(offlineDesign('99 sectores').network.nodes).toHaveLength(8)
    expect(offlineDesign('0 sectores').network.nodes).toHaveLength(4)
    expect(offlineDesign('hazme una red').network.nodes).toHaveLength(6)
  })
})

describe('offlineAudit', () => {
  it('nombra los tramos problemáticos y el DN sugerido', () => {
    expect(offlineAudit(makeSectors(3))).toMatch(/c2.*DN75/)
  })
  it('informa que todo está en rango', () => {
    const net = makeSectors(3)
    net.pipes.at(-1).diameter = 75
    expect(offlineAudit(net)).toMatch(/dentro de rango/)
  })
})

describe('offlineOptimize', () => {
  it('corrige los tramos con velocidad excesiva sin mutar la entrada', () => {
    const net = makeSectors(3)
    const r = offlineOptimize(net)
    expect(r.changes).toEqual([{ type: 'diameter', elementId: 'c2', from: 50, to: 75 }])
    expect(r.network.pipes.every((p) => pipeStatus(p, true) === 'ok')).toBe(true)
    expect(net.pipes.at(-1).diameter).toBe(50)
  })
  it('no cambia nada si la red ya está bien', () => {
    expect(offlineOptimize(offlineOptimize(makeSectors(3)).network).message).toMatch(/nada que optimizar/)
  })
})

describe('offlineCopilot', () => {
  it.each([
    ['Auditar presiones de la red', 'audit'],
    ['Diseñar red para 3 sectores', 'design'],
    ['hola', 'help'],
  ])('%s -> %s', (prompt, intent) => {
    expect(offlineCopilot(prompt, makeSectors(3)).intent).toBe(intent)
  })
})
