import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Inspector from './Inspector'
import { makeSectors } from '../lib/network'

const net = makeSectors(3)
const noSim = { result: null, issues: [], pipeResult: () => null, nodeResult: () => null }
const result = {
  summary: { minPressure: 13.3 },
  pipes: [{ id: 'c2', headLoss: 46.09, length: 125.3, suggestedDiameter: 75 }],
}
const withSim = {
  result,
  issues: [
    { severity: 'warning', code: 'HIGH_VELOCITY', elementId: 'c2', message: 'El tramo J1→S3 circula a 4.07 m/s.', suggestion: 'Usa DN75.' },
    { severity: 'critical', code: 'NO_SOURCE', elementId: null, message: 'Sin tanque.' },
  ],
  pipeResult: (id) => result.pipes.find((p) => p.id === id) ?? null,
  nodeResult: (id) => (id === 'S1' ? { pressure: 42.5, status: 'ok' } : id === 'J1' ? { pressure: 5, status: 'low' } : null),
}
const setup = (extra = {}) => {
  const p = { net, selected: null, running: false, simulation: noSim, onNode: vi.fn(), onPipe: vi.fn(), onDelete: vi.fn(), onCommit: vi.fn(), onSelect: vi.fn(), ...extra }
  render(<Inspector {...p} />)
  return p
}

describe('Inspector · resumen', () => {
  it('muestra métricas y la tabla de tramos con velocidad', () => {
    setup()
    expect(screen.getByText('Componentes').nextSibling).toHaveTextContent('6')
    expect(screen.getByText('Caudal máx.').nextSibling).toHaveTextContent('12')
    expect(screen.getByText('Presión mín.').nextSibling).toHaveTextContent('—')
    expect(screen.getByText('▲ 4.07')).toBeInTheDocument()
    expect(screen.getByText(/Simular Flujo/)).toBeInTheDocument()
  })
  it('seleccionar una fila elige la tubería', async () => {
    const p = setup()
    await userEvent.click(screen.getByText('J1→S3'))
    expect(p.onSelect).toHaveBeenCalledWith({ kind: 'pipe', id: 'c2' })
  })
  it('con simulación muestra presión mínima, pérdida de carga y problemas', () => {
    const p = setup({ running: true, simulation: withSim })
    expect(screen.getByText('Presión mín.').nextSibling).toHaveTextContent('13.3')
    expect(screen.getByText('46.09')).toBeInTheDocument()
    expect(screen.getByText('Usa DN75.')).toBeInTheDocument()
    expect(screen.getByText('Sin tanque.')).toBeInTheDocument()
    return userEvent.click(screen.getByText(/J1→S3 circula/)).then(() => {
      expect(p.onSelect).toHaveBeenCalledWith({ kind: 'pipe', id: 'c2' })
    })
  })
})

describe('Inspector · nodo', () => {
  const sel = (id) => ({ kind: 'node', id })
  it('el tanque edita nivel de agua y cota, sin demanda', () => {
    setup({ selected: sel('T1') })
    expect(screen.getByText('Nivel de agua')).toBeInTheDocument()
    expect(screen.getByText('Cota')).toBeInTheDocument()
    expect(screen.queryByText('Demanda')).not.toBeInTheDocument()
  })
  it('la bomba edita su altura', () => {
    setup({ selected: sel('P1') })
    expect(screen.getByText('Altura de bomba')).toBeInTheDocument()
  })
  it('el nodo de consumo edita la demanda y muestra la presión calculada', () => {
    setup({ selected: sel('S1'), running: true, simulation: withSim })
    expect(screen.getByText('Demanda')).toBeInTheDocument()
    expect(screen.getByText('Presión calculada').nextSibling).toHaveTextContent('42.5')
  })
  it('renombra el componente', () => {
    const p = setup({ selected: sel('S1') })
    fireEvent.change(screen.getByLabelText(/Nodo/), { target: { value: 'Barrio Norte' } })
    expect(p.onNode).toHaveBeenCalledWith('S1', { name: 'Barrio Norte' })
  })
  it('un control de rango crea un punto de historial al pulsarlo', () => {
    const p = setup({ selected: sel('S1') })
    const slider = screen.getAllByRole('slider')[0]
    fireEvent.pointerDown(slider)
    expect(p.onCommit).toHaveBeenCalledTimes(1)
    fireEvent.change(slider, { target: { value: '30' } })
    expect(p.onNode).toHaveBeenCalled()
  })
  it('eliminar llama a onDelete', async () => {
    const p = setup({ selected: sel('S1') })
    await userEvent.click(screen.getByLabelText('Eliminar elemento seleccionado'))
    expect(p.onDelete).toHaveBeenCalled()
  })
})

describe('Inspector · tubería', () => {
  const sel = { kind: 'pipe', id: 'c2' }
  it('sin simular no ofrece el diámetro sugerido', () => {
    setup({ selected: sel })
    expect(screen.queryByText(/Aplicar DN/)).not.toBeInTheDocument()
    expect(screen.getByText('Velocidad').nextSibling).toHaveTextContent('4.07')
  })
  it('simulando con velocidad excesiva ofrece aplicar el DN del backend', async () => {
    const p = setup({ selected: sel, running: true, simulation: withSim })
    expect(screen.getByText('Longitud').nextSibling).toHaveTextContent('125.3')
    await userEvent.click(screen.getByText(/Aplicar DN75/))
    expect(p.onCommit).toHaveBeenCalled()
    expect(p.onPipe).toHaveBeenCalledWith('c2', { diameter: 75 })
  })
  it('sin resultado remoto calcula el DN sugerido en local', () => {
    setup({ selected: sel, running: true })
    expect(screen.getByText(/Aplicar DN75/)).toBeInTheDocument()
  })
  it('una tubería correcta no muestra advertencia', () => {
    setup({ selected: { kind: 'pipe', id: 'a' }, running: true })
    expect(screen.queryByText(/Velocidad excesiva/)).not.toBeInTheDocument()
  })
})
