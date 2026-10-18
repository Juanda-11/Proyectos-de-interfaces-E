import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Canvas from './Canvas'
import { makeSectors } from '../lib/network'
import { pipeStatus } from '../lib/hydraulics'

const net = makeSectors(3)
const setup = (extra = {}) => {
  const p = {
    nodes: net.nodes, pipes: net.pipes, selected: null, tool: 'select', running: false,
    view: { x: 0, y: 0, k: 1 }, onView: vi.fn(), snapOn: true, onToggleSnap: vi.fn(),
    onDragStart: vi.fn(), onSelect: vi.fn(), onMove: vi.fn(), onConnect: vi.fn(), onNudge: vi.fn(),
    statusOfPipe: (pipe) => pipeStatus(pipe, extra.running ?? false), ...extra,
  }
  render(<Canvas {...p} />)
  return p
}

describe('Canvas', () => {
  it('dibuja un botón accesible por cada nodo y tubería', () => {
    setup()
    expect(screen.getAllByRole('button', { name: /^Tubería/ })).toHaveLength(5)
    expect(screen.getByRole('button', { name: /^Tanque T1, tanque/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Bomba B1, bomba/ })).toBeInTheDocument()
  })
  it('selecciona un nodo con el ratón y con el teclado', () => {
    const p = setup()
    const node = screen.getByRole('button', { name: /^Sector 1, nodo/ })
    fireEvent.pointerDown(node)
    expect(p.onSelect).toHaveBeenCalledWith({ kind: 'node', id: 'S1' })
    p.onSelect.mockClear()
    fireEvent.keyDown(node, { key: 'Enter' })
    expect(p.onSelect).toHaveBeenCalledWith({ kind: 'node', id: 'S1' })
  })
  it('selecciona una tubería', () => {
    const p = setup()
    fireEvent.pointerDown(screen.getAllByRole('button', { name: /^Tubería/ })[0])
    expect(p.onSelect).toHaveBeenCalledWith({ kind: 'pipe', id: 'a' })
  })
  it('las flechas mueven el nodo una celda de la cuadrícula', () => {
    const p = setup()
    const t1 = net.nodes.find((n) => n.id === 'T1')
    fireEvent.keyDown(screen.getByRole('button', { name: /^Tanque T1, tanque/ }), { key: 'ArrowRight' })
    expect(p.onNudge).toHaveBeenCalledWith('T1', t1.x + 20, t1.y)
    fireEvent.keyDown(screen.getByRole('button', { name: /^Tanque T1, tanque/ }), { key: 'ArrowUp' })
    expect(p.onNudge).toHaveBeenLastCalledWith('T1', t1.x, t1.y - 20)
  })
  it('con la herramienta Tubería conecta dos nodos distintos', () => {
    const p = setup({ tool: 'pipe' })
    expect(screen.getByRole('status')).toHaveTextContent('dos componentes')
    fireEvent.pointerDown(screen.getByRole('button', { name: /^Sector 1, nodo/ }))
    expect(screen.getByRole('status')).toHaveTextContent('segundo componente')
    fireEvent.pointerDown(screen.getByRole('button', { name: /^Sector 2, nodo/ }))
    expect(p.onConnect).toHaveBeenCalledWith('S1', 'S2')
    expect(p.onSelect).not.toHaveBeenCalled()
  })
  it('no conecta un nodo consigo mismo', () => {
    const p = setup({ tool: 'pipe' })
    const node = screen.getByRole('button', { name: /^Sector 1, nodo/ })
    fireEvent.pointerDown(node)
    fireEvent.pointerDown(node)
    expect(p.onConnect).not.toHaveBeenCalled()
  })
  it('resalta en naranja la tubería con velocidad excesiva al simular', () => {
    setup({ running: true })
    expect(screen.getByRole('button', { name: /Sector 3.*velocidad excesiva/ })).toBeInTheDocument()
    expect(screen.getAllByText(/m\/s/).length).toBeGreaterThan(0)
  })
  it('muestra la presión calculada de los nodos', () => {
    setup({ nodeResult: (id) => (id === 'S3' ? { pressure: 13.3, status: 'ok' } : null) })
    expect(screen.getByText('13.3 m.c.a.')).toBeInTheDocument()
  })
  it('los controles de vista llaman a onView y onToggleSnap', () => {
    const p = setup()
    fireEvent.click(screen.getByLabelText('Restablecer vista'))
    expect(p.onView).toHaveBeenCalledWith({ x: 0, y: 0, k: 1 })
    fireEvent.click(screen.getByLabelText('Ajuste a cuadrícula'))
    expect(p.onToggleSnap).toHaveBeenCalled()
    expect(screen.getByLabelText('Ajuste a cuadrícula')).toHaveAttribute('aria-pressed', 'true')
  })
  it('los botones de zoom piden un nivel mayor o menor', () => {
    const p = setup()
    vi.spyOn(SVGElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 800, height: 600, left: 0, top: 0 })
    fireEvent.click(screen.getByLabelText('Acercar'))
    expect(p.onView.mock.calls[0][0].k).toBeCloseTo(1.25)
    fireEvent.click(screen.getByLabelText('Alejar'))
    expect(p.onView.mock.calls[1][0].k).toBeCloseTo(0.8)
  })
})
