import { describe, it, expect } from 'vitest'
import { parseNetwork } from './parseNetwork'
import { makeSectors } from './network'

describe('parseNetwork', () => {
  it('acepta una red exportada por la aplicación', () => {
    const net = makeSectors(3)
    expect(parseNetwork(JSON.parse(JSON.stringify(net)))).toEqual({ net })
  })
  it('completa propiedades que faltan con los valores por defecto del tipo', () => {
    const { net } = parseNetwork({ nodes: [{ id: 'A', type: 'tank', x: 1, y: 2 }], pipes: [] })
    expect(net.nodes[0]).toMatchObject({ pressure: 15, elevation: 15, name: 'Tanque A' })
  })
  it.each([
    ['null', null],
    ['sin nodos', { pipes: [] }],
    ['sin tuberías', { nodes: [] }],
    ['tipo desconocido', { nodes: [{ id: 'A', type: 'x', x: 0, y: 0 }], pipes: [] }],
    ['coordenadas no numéricas', { nodes: [{ id: 'A', type: 'tank', x: '0', y: 0 }], pipes: [] }],
    ['nodo sin id', { nodes: [{ type: 'tank', x: 0, y: 0 }], pipes: [] }],
    [
      'nodo repetido',
      {
        nodes: [
          { id: 'A', type: 'tank', x: 0, y: 0 },
          { id: 'A', type: 'tank', x: 0, y: 0 },
        ],
        pipes: [],
      },
    ],
    [
      'tubería a nodo inexistente',
      {
        nodes: [{ id: 'A', type: 'tank', x: 0, y: 0 }],
        pipes: [{ id: 'p', from: 'A', to: 'Z', diameter: 50, flow: 1 }],
      },
    ],
    [
      'tubería a sí misma',
      {
        nodes: [{ id: 'A', type: 'tank', x: 0, y: 0 }],
        pipes: [{ id: 'p', from: 'A', to: 'A', diameter: 50, flow: 1 }],
      },
    ],
    [
      'diámetro inválido',
      {
        nodes: [
          { id: 'A', type: 'tank', x: 0, y: 0 },
          { id: 'B', type: 'tank', x: 0, y: 0 },
        ],
        pipes: [{ id: 'p', from: 'A', to: 'B', diameter: 0, flow: 1 }],
      },
    ],
  ])('rechaza: %s', (_n, data) => {
    expect(parseNetwork(data)).toHaveProperty('error')
  })
  it('rechaza redes enormes', () => {
    const nodes = Array.from({ length: 201 }, (_, i) => ({
      id: `n${i}`,
      type: 'junction',
      x: 0,
      y: 0,
    }))
    expect(parseNetwork({ nodes, pipes: [] }).error).toMatch(/demasiado grande/)
  })
})
