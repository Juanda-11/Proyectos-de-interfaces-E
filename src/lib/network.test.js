import { describe, it, expect } from 'vitest'
import { makeSectors, newId } from './network'
import { pipeStatus } from './hydraulics'

describe('makeSectors', () => {
  it('crea tanque, bomba, nodo y n sectores', () => {
    const net = makeSectors(4)
    expect(net.nodes).toHaveLength(7)
    expect(net.pipes).toHaveLength(6)
  })
  it('deja el último sector con la tubería subdimensionada', () => {
    const warns = makeSectors(3).pipes.filter((p) => pipeStatus(p, true) === 'warn')
    expect(warns.map((p) => p.id)).toEqual(['c2'])
  })
  it('todas las tuberías conectan nodos existentes', () => {
    const { nodes, pipes } = makeSectors(5)
    const ids = new Set(nodes.map((n) => n.id))
    expect(pipes.every((p) => ids.has(p.from) && ids.has(p.to))).toBe(true)
  })
})

describe('newId', () => {
  it('genera ids distintos', () => {
    expect(new Set(Array.from({ length: 200 }, newId)).size).toBe(200)
  })
})
