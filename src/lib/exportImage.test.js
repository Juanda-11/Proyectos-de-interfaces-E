import { describe, it, expect } from 'vitest'
import { networkToSvg } from './exportImage'
import { makeSectors } from './network'
import { pipeStatus } from './hydraulics'

const net = makeSectors(3)
const parse = (svg) => new DOMParser().parseFromString(svg, 'image/svg+xml')

describe('networkToSvg', () => {
  it('genera un SVG válido con un grupo por nodo y tubería', () => {
    const { svg, width, height } = networkToSvg(net)
    const doc = parse(svg)
    expect(doc.querySelector('parsererror')).toBeNull()
    expect(doc.documentElement.getAttribute('viewBox').split(' ').map(Number)).toHaveLength(4)
    expect(doc.querySelectorAll('svg > g')).toHaveLength(net.nodes.length + net.pipes.length)
    expect(width).toBeGreaterThan(500)
    expect(height).toBeGreaterThan(300)
  })
  it('colorea de naranja las tuberías con advertencia', () => {
    const { svg } = networkToSvg(net, { statusOfPipe: (p) => pipeStatus(p, true) })
    expect(svg.match(/stroke="#F97316"/g)).toHaveLength(1)
  })
  it('incluye nombres y presiones calculadas', () => {
    const { svg } = networkToSvg(net, {
      nodeResult: (id) => (id === 'S1' ? { pressure: 42.55, status: 'ok' } : null),
    })
    expect(svg).toContain('Sector 1')
    expect(svg).toContain('42.5 m.c.a.')
  })
  it('escapa texto con caracteres especiales', () => {
    const odd = { nodes: [{ ...net.nodes[0], name: '<Tanque & "Norte">' }], pipes: [] }
    const { svg } = networkToSvg(odd)
    expect(parse(svg).querySelector('parsererror')).toBeNull()
    expect(svg).toContain('&lt;Tanque &amp; &quot;Norte&quot;&gt;')
  })
  it('encuadra la red sin dejar espacio vacío hasta el origen', () => {
    const far = {
      nodes: [
        { ...net.nodes[0], x: 1000, y: 800 },
        { ...net.nodes[1], x: 1200, y: 900 },
      ],
      pipes: [],
    }
    const { svg, width } = networkToSvg(far)
    const [x0] = parse(svg).documentElement.getAttribute('viewBox').split(' ').map(Number)
    expect(x0).toBe(910)
    expect(width).toBe(380)
  })
  it('omite tuberías con extremos inexistentes y soporta una red vacía', () => {
    const broken = {
      nodes: net.nodes.slice(0, 1),
      pipes: [{ id: 'x', from: 'T1', to: 'ZZ', diameter: 50, flow: 1 }],
    }
    expect(parse(networkToSvg(broken).svg).querySelectorAll('svg > g')).toHaveLength(1)
    const empty = networkToSvg({ nodes: [], pipes: [] })
    expect(empty.width).toBeGreaterThan(0)
  })
})

describe('networkToSvg · tema', () => {
  it('usa colores claros con theme="light" y oscuros por defecto', () => {
    const dark = networkToSvg(net).svg
    const light = networkToSvg(net, { theme: 'light' }).svg
    expect(dark).toContain('fill="#0F172A"/>')
    expect(light).toContain('fill="#F1F5F9"/>')
    expect(light).not.toContain('fill="#1E293B"')
    expect(light).toContain('fill="#FFFFFF"')
  })
  it('el título por defecto sigue el idioma activo', async () => {
    const { setLanguage } = await import('../i18n')
    expect(networkToSvg(net).svg).toContain('Red de distribución')
    setLanguage('en')
    try {
      expect(networkToSvg(net).svg).toContain('Distribution network')
    } finally {
      setLanguage('es')
    }
  })
})
