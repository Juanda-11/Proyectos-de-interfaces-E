import { describe, it, expect } from 'vitest'
import { fitView } from './view'

const nodes = [
  { x: 100, y: 100 },
  { x: 700, y: 400 },
]

describe('fitView', () => {
  it('sin nodos devuelve la vista inicial', () => {
    expect(fitView([], 800, 600)).toEqual({ x: 0, y: 0, k: 1 })
  })
  it('encuadra todos los nodos dentro del lienzo', () => {
    const { x, y, k } = fitView(nodes, 800, 600)
    for (const n of nodes) {
      const sx = n.x * k + x
      const sy = n.y * k + y
      expect(sx).toBeGreaterThan(0)
      expect(sx).toBeLessThan(800)
      expect(sy).toBeGreaterThan(0)
      expect(sy).toBeLessThan(600)
    }
  })
  it('centra la red', () => {
    const { x, k } = fitView(nodes, 1000, 600)
    const left = 100 * k + x
    const right = 1000 - (700 * k + x)
    expect(left).toBeCloseTo(right)
  })
  it('aleja si la red es más grande que el lienzo y no pasa del 150 % si es pequeña', () => {
    expect(
      fitView(
        [
          { x: 0, y: 0 },
          { x: 3000, y: 2000 },
        ],
        800,
        600,
      ).k,
    ).toBeLessThan(0.5)
    expect(fitView([{ x: 5, y: 5 }], 2000, 1500).k).toBe(1.5)
  })
  it('respeta los límites de zoom', () => {
    expect(
      fitView(
        [
          { x: 0, y: 0 },
          { x: 90000, y: 90000 },
        ],
        800,
        600,
      ).k,
    ).toBe(0.3)
  })
  it('ignora tamaños de lienzo no válidos', () => {
    expect(fitView(nodes, 0, 0)).toEqual({ x: 0, y: 0, k: 1 })
  })
})
