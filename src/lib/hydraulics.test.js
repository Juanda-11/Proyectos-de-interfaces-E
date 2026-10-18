import { describe, it, expect } from 'vitest'
import { velocity, pipeStatus, suggestDiameter, velocityTier, MAX_V } from './hydraulics'

describe('velocity', () => {
  it('calcula Q/A', () => {
    expect(velocity({ flow: 8, diameter: 50 })).toBeCloseTo(4.074, 2)
    expect(velocity({ flow: 4, diameter: 100 })).toBeCloseTo(0.509, 2)
  })
})

describe('pipeStatus', () => {
  const pipe = { flow: 8, diameter: 50 }
  it('es idle si no se simula', () => expect(pipeStatus(pipe, false)).toBe('idle'))
  it('advierte sobre el límite de velocidad', () => {
    expect(pipeStatus(pipe, true)).toBe('warn')
    expect(pipeStatus({ flow: 4, diameter: 100 }, true)).toBe('ok')
    expect(MAX_V).toBe(2.5)
  })
})

describe('suggestDiameter', () => {
  it('devuelve múltiplos de 25 mm con v <= 2 m/s', () => {
    for (const flow of [1, 4, 8, 12, 30]) {
      const diameter = suggestDiameter({ flow })
      expect(diameter % 25).toBe(0)
      expect(velocity({ flow, diameter })).toBeLessThanOrEqual(2.0001)
    }
  })
  it('8 L/s requieren DN75 y nunca baja de 25 mm', () => {
    expect(suggestDiameter({ flow: 8 })).toBe(75)
    expect(suggestDiameter({ flow: 0.01 })).toBe(25)
  })
})

describe('velocityTier', () => {
  it('clasifica por velocidad de diseño y máxima', () => {
    expect(velocityTier({ flow: 4, diameter: 100 })).toBe('ok') // 0.51 m/s
    expect(velocityTier({ flow: 4, diameter: 50 })).toBe('caution') // 2.04 m/s
    expect(velocityTier({ flow: 8, diameter: 50 })).toBe('warn') // 4.07 m/s
  })
})
