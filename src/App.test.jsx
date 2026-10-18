import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { ToastProvider } from './hooks/useToasts'
import { ApiError, api } from './api/client'
import { downloadBlob } from './lib/download'
import { makeSectors } from './lib/network'
import { loadNetwork, saveNetwork } from './lib/storage'

vi.mock('./api/client', async (orig) => ({
  ...(await orig()),
  api: { health: vi.fn(), simulate: vi.fn(), optimize: vi.fn(), copilot: vi.fn(), exportEpanet: vi.fn() },
}))
vi.mock('./lib/download', () => ({ downloadBlob: vi.fn(), downloadJSON: vi.fn() }))

const simResult = {
  summary: { status: 'warning', minPressure: 13.3 },
  nodes: [],
  pipes: [{ id: 'c2', status: 'warn', headLoss: 46, length: 125, suggestedDiameter: 75 }],
  issues: [{ severity: 'warning', code: 'HIGH_VELOCITY', elementId: 'c2', message: 'Tramo J1→S3 a 4.07 m/s', suggestion: 'Usa DN75.' }],
}
const fixed = () => {
  const net = makeSectors(3)
  net.pipes.at(-1).diameter = 75
  return net
}
const renderApp = () => render(<ToastProvider><App /></ToastProvider>)
const footer = () => screen.getByText(/nodos ·/)

beforeEach(() => {
  for (const fn of Object.values(api)) fn.mockReset()
  api.health.mockResolvedValue({ status: 'ok', ai: 'rules' })
  api.simulate.mockResolvedValue(simResult)
  vi.mocked(downloadBlob).mockReset()
})

describe('App', () => {
  it('arranca con la red de ejemplo y consulta el estado del servidor', async () => {
    renderApp()
    expect(footer()).toHaveTextContent('6 nodos · 5 tuberías')
    expect(await screen.findByText(/Servidor conectado/)).toBeInTheDocument()
  })

  it('recupera la red guardada del almacenamiento local', () => {
    saveNetwork(makeSectors(5))
    renderApp()
    expect(footer()).toHaveTextContent('8 nodos · 7 tuberías')
  })

  it('guarda automáticamente los cambios', async () => {
    renderApp()
    await userEvent.click(screen.getByTitle('Bomba'))
    await waitFor(() => expect(loadNetwork().nodes).toHaveLength(7), { timeout: 2000 })
  })

  it('simular consulta al backend y muestra advertencias y problemas', async () => {
    renderApp()
    await userEvent.click(screen.getByText('Simular Flujo'))
    expect(await screen.findByText('1 advertencia')).toBeInTheDocument()
    await waitFor(() => expect(api.simulate).toHaveBeenCalled())
    expect(await screen.findByText('Usa DN75.')).toBeInTheDocument()
  })

  it('sin servidor avisa y sigue calculando velocidades en local', async () => {
    api.simulate.mockRejectedValue(new ApiError('sin red', { code: 'NETWORK' }))
    renderApp()
    await userEvent.click(screen.getByText('Simular Flujo'))
    expect(await screen.findByText(/Sin conexión con el servidor/)).toBeInTheDocument()
    expect(screen.getByText('Modo local')).toBeInTheDocument()
    expect(screen.getByText('1 advertencia')).toBeInTheDocument()
  })

  it('optimizar aplica la red del backend y lo comunica', async () => {
    api.optimize.mockResolvedValue({ network: fixed(), changes: [{ type: 'diameter' }], message: 'Apliqué 1 cambio(s).' })
    api.simulate.mockResolvedValue({ ...simResult, issues: [], pipes: [] })
    renderApp()
    await userEvent.click(screen.getByText('Optimizar'))
    expect(await screen.findByText('Apliqué 1 cambio(s).')).toBeInTheDocument()
    expect(screen.getByLabelText('Deshacer (Ctrl+Z)')).toBeEnabled()
    await waitFor(() => expect(api.simulate).toHaveBeenCalledWith(expect.objectContaining({ pipes: expect.arrayContaining([expect.objectContaining({ id: 'c2', diameter: 75 })]) })))
  })

  it('optimizar sin servidor usa el cálculo local', async () => {
    api.optimize.mockRejectedValue(new ApiError('sin red', { code: 'NETWORK' }))
    renderApp()
    await userEvent.click(screen.getByText('Optimizar'))
    expect(await screen.findByText(/Ajusté 1 diámetro\(s\) sin conexión/)).toBeInTheDocument()
  })

  it('un error del servidor al optimizar se muestra al usuario', async () => {
    api.optimize.mockRejectedValue(new ApiError('Datos inválidos', { status: 400, code: 'VALIDATION_ERROR' }))
    renderApp()
    await userEvent.click(screen.getByText('Optimizar'))
    expect(await screen.findByText(/No se pudo optimizar: Datos inválidos/)).toBeInTheDocument()
  })

  it('añadir un componente actualiza el recuento y lo selecciona', async () => {
    renderApp()
    await userEvent.click(screen.getByTitle('Tanque'))
    expect(footer()).toHaveTextContent('7 nodos')
    expect(screen.getByLabelText(/Tanque ·|Tanque/, { selector: '#node-name' })).toHaveValue('Tanque 2')
  })

  it('Supr elimina el elemento seleccionado y Ctrl+Z lo recupera', async () => {
    renderApp()
    fireEvent.pointerDown(screen.getByRole('button', { name: /^Sector 1, nodo/ }))
    fireEvent.keyDown(window, { key: 'Delete' })
    expect(footer()).toHaveTextContent('5 nodos · 4 tuberías')
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true })
    expect(footer()).toHaveTextContent('6 nodos · 5 tuberías')
    fireEvent.keyDown(window, { key: 'y', ctrlKey: true })
    expect(footer()).toHaveTextContent('5 nodos')
  })

  it('Borrar dentro de un campo de texto no elimina el elemento', async () => {
    renderApp()
    fireEvent.pointerDown(screen.getByRole('button', { name: /^Sector 1, nodo/ }))
    const name = screen.getByLabelText(/Nodo/, { selector: '#node-name' })
    await userEvent.type(name, '{Backspace}')
    expect(footer()).toHaveTextContent('6 nodos')
  })

  it('Escape quita la selección', () => {
    renderApp()
    fireEvent.pointerDown(screen.getByRole('button', { name: /^Sector 1, nodo/ }))
    expect(screen.getByLabelText('Eliminar elemento seleccionado')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByLabelText('Eliminar elemento seleccionado')).not.toBeInTheDocument()
  })

  it('importa una red válida y rechaza una inválida', async () => {
    renderApp()
    const input = screen.getByLabelText('Importar red desde archivo JSON')
    const bad = new File(['{no es json'], 'x.json', { type: 'application/json' })
    fireEvent.change(input, { target: { files: [bad] } })
    expect(await screen.findByText('El archivo no es un JSON válido.')).toBeInTheDocument()

    const wrong = new File([JSON.stringify({ nodes: [], pipes: 3 })], 'y.json', { type: 'application/json' })
    fireEvent.change(input, { target: { files: [wrong] } })
    expect(await screen.findByText(/no tiene el formato/)).toBeInTheDocument()

    const good = new File([JSON.stringify(makeSectors(2))], 'z.json', { type: 'application/json' })
    fireEvent.change(input, { target: { files: [good] } })
    expect(await screen.findByText(/Red importada: 5 componentes y 4 tuberías/)).toBeInTheDocument()
    expect(footer()).toHaveTextContent('5 nodos · 4 tuberías')
  })

  it('exporta a EPANET con el backend y avisa si no hay conexión', async () => {
    api.exportEpanet.mockResolvedValueOnce(new Blob(['[END]']))
    renderApp()
    await userEvent.click(screen.getByText('Archivo'))
    await userEvent.click(screen.getByRole('menuitem', { name: /EPANET/ }))
    await waitFor(() => expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob), 'hydrograph-red.inp'))

    api.exportEpanet.mockRejectedValueOnce(new ApiError('x', { code: 'NETWORK' }))
    await userEvent.click(screen.getByText('Archivo'))
    await userEvent.click(screen.getByRole('menuitem', { name: /EPANET/ }))
    expect(await screen.findByText(/requiere conexión/)).toBeInTheDocument()
  })

  it('el copiloto puede reemplazar la red por una diseñada', async () => {
    api.copilot.mockResolvedValue({ intent: 'design', source: 'ai', message: 'Red generada.', network: makeSectors(1) })
    renderApp()
    await userEvent.click(screen.getByText('Copiloto IA'))
    await userEvent.type(screen.getByLabelText('Orden para el copiloto'), 'diseña una red{Enter}')
    expect(await screen.findByText('Red generada.')).toBeInTheDocument()
    expect(footer()).toHaveTextContent('4 nodos · 3 tuberías')
    expect(api.copilot).toHaveBeenCalledWith('diseña una red', expect.objectContaining({ nodes: expect.any(Array) }))
  })

  it('una auditoría del copiloto arranca la simulación', async () => {
    api.copilot.mockResolvedValue({ intent: 'audit', source: 'rules', message: 'Detecté 1 problema.' })
    renderApp()
    await userEvent.click(screen.getByText('Copiloto IA'))
    await userEvent.type(screen.getByLabelText('Orden para el copiloto'), 'auditar{Enter}')
    expect(await screen.findByText('Detener')).toBeInTheDocument()
  })

  it('si el servidor devuelve una red inválida lo informa en el copiloto', async () => {
    api.copilot.mockResolvedValue({ intent: 'design', message: 'ok', network: { nodes: [], pipes: 1 } })
    renderApp()
    await userEvent.click(screen.getByText('Copiloto IA'))
    await userEvent.type(screen.getByLabelText('Orden para el copiloto'), 'diseña{Enter}')
    expect(await screen.findByText(/red inválida/)).toBeInTheDocument()
  })

  it('sin servidor el copiloto responde con el motor local', async () => {
    api.copilot.mockRejectedValue(new ApiError('sin red', { code: 'NETWORK' }))
    renderApp()
    await userEvent.click(screen.getByText('Copiloto IA'))
    await userEvent.type(screen.getByLabelText('Orden para el copiloto'), 'Diseñar red para 2 sectores{Enter}')
    expect(await screen.findByText(/Red generada sin conexión/)).toBeInTheDocument()
    expect(footer()).toHaveTextContent('5 nodos')
  })

  it('«Nueva red de ejemplo» restaura la demo y se puede deshacer', async () => {
    saveNetwork(makeSectors(5))
    renderApp()
    await userEvent.click(screen.getByText('Archivo'))
    await userEvent.click(screen.getByRole('menuitem', { name: /Nueva red/ }))
    expect(footer()).toHaveTextContent('6 nodos')
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true })
    expect(footer()).toHaveTextContent('8 nodos')
  })
})
