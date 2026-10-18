import { describe, it, expect } from 'vitest'
import { buildReport } from './report'
import { makeSectors } from './network'

const net = makeSectors(3)
const date = new Date('2026-10-18T12:00:00Z')
const result = {
  summary: {
    status: 'warning',
    maxVelocity: 4.07,
    minPressure: 13.3,
    maxPressure: 59.7,
    totalHeadLoss: 47.5,
  },
  pipes: [{ id: 'c2', velocity: 4.07, length: 125.3, headLoss: 46.09 }],
  nodes: [
    { id: 'S3', pressure: 13.3, status: 'ok' },
    { id: 'S1', pressure: 4, status: 'low' },
  ],
  issues: [
    { severity: 'warning', message: 'El tramo J1→S3 circula a 4.07 m/s.', suggestion: 'Usa DN75.' },
  ],
}

describe('buildReport', () => {
  it('sin simulación avisa y usa velocidades locales', () => {
    const md = buildReport(net, { date })
    expect(md).toContain('# Informe de red')
    expect(md).toContain('No hay simulación del servidor')
    expect(md).toContain('| Nodo J1 → Sector 3 | 50 | 8 | 4.07 | — | — | Velocidad excesiva |')
    expect(md).not.toContain('## Problemas detectados')
  })
  it('con simulación incluye resumen, presiones, pérdidas y problemas', () => {
    const md = buildReport(net, { result, date })
    expect(md).toContain('Estado: **con advertencias**')
    expect(md).toContain('Presión mínima / máxima: 13.3 / 59.7 m.c.a.')
    expect(md).toContain('| 125.3 | 46.09 |')
    expect(md).toContain('| Sector 1 | Nodo | 0 | 4 | 4.0 | Presión baja |')
    expect(md).toContain('- **Advertencia**: El tramo J1→S3 circula a 4.07 m/s. Usa DN75.')
  })
  it('suma la demanda de los nodos de consumo', () => {
    expect(buildReport(net, { date })).toContain('Demanda total: 16 L/s')
  })
  it('indica cuando no hay problemas y escapa barras verticales', () => {
    const odd = { nodes: [{ ...net.nodes[0], name: 'A|B' }], pipes: [] }
    const md = buildReport(odd, { result: { ...result, issues: [], pipes: [], nodes: [] }, date })
    expect(md).toContain('Sin problemas.')
    expect(md).toContain('A\\|B')
  })
})
