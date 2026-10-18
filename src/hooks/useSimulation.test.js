import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useSimulation } from './useSimulation'
import { ApiError, api } from '../api/client'
import { makeSectors } from '../lib/network'

vi.mock('../api/client', async (orig) => ({ ...(await orig()), api: { simulate: vi.fn() } }))

const net = makeSectors(3)
const remote = {
  summary: { status: 'warning' },
  nodes: [{ id: 'S1', pressure: 42 }],
  pipes: [{ id: 'c2', status: 'warn', velocity: 4.07, headLoss: 46 }, { id: 'c0', status: 'ok' }],
  issues: [{ severity: 'warning', code: 'HIGH_VELOCITY' }, { severity: 'info', code: 'LOW_VELOCITY' }],
}

beforeEach(() => {
  api.simulate.mockReset()
})

describe('useSimulation', () => {
  it('no llama al backend mientras está detenida y usa estado idle', () => {
    const { result } = renderHook(() => useSimulation(net))
    expect(result.current.running).toBe(false)
    expect(result.current.statusOfPipe(net.pipes[0])).toBe('idle')
    expect(api.simulate).not.toHaveBeenCalled()
  })

  it('al iniciar simula en el backend y expone resultados', async () => {
    api.simulate.mockResolvedValue(remote)
    const { result } = renderHook(() => useSimulation(net))
    act(() => result.current.toggle())
    await waitFor(() => expect(result.current.status).toBe('ok'))
    expect(api.simulate).toHaveBeenCalledWith(net)
    expect(result.current.pipeResult('c2').velocity).toBe(4.07)
    expect(result.current.nodeResult('S1').pressure).toBe(42)
    expect(result.current.warningCount).toBe(1) // ignora los avisos informativos
    expect(result.current.statusOfPipe({ id: 'c2' })).toBe('warn')
  })

  it('usa el cálculo local mientras llega la respuesta', () => {
    api.simulate.mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useSimulation(net))
    act(() => result.current.start())
    expect(result.current.statusOfPipe(net.pipes.at(-1))).toBe('warn')
    expect(result.current.warningCount).toBe(1)
  })

  it('pasa a modo sin conexión si el backend no responde', async () => {
    api.simulate.mockRejectedValue(new ApiError('sin red', { code: 'NETWORK' }))
    const onOffline = vi.fn()
    const { result } = renderHook(() => useSimulation(net, { onOffline }))
    act(() => result.current.start())
    await waitFor(() => expect(result.current.status).toBe('offline'))
    expect(onOffline).toHaveBeenCalled()
    expect(result.current.result).toBeNull()
    expect(result.current.running).toBe(true)
    expect(result.current.statusOfPipe(net.pipes.at(-1))).toBe('warn')
  })

  it('avisa de la pérdida de conexión una sola vez aunque se recalcule', async () => {
    api.simulate.mockRejectedValue(new ApiError('sin red', { code: 'NETWORK' }))
    const onOffline = vi.fn()
    const { result, rerender } = renderHook(({ n }) => useSimulation(n, { onOffline }), { initialProps: { n: net } })
    act(() => result.current.start())
    await waitFor(() => expect(result.current.status).toBe('offline'))
    rerender({ n: { ...net, pipes: [...net.pipes] } })
    await waitFor(() => expect(api.simulate).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(result.current.status).toBe('offline'))
    expect(onOffline).toHaveBeenCalledTimes(1)
  })

  it('informa errores de validación sin pasar a offline', async () => {
    api.simulate.mockRejectedValue(new ApiError('inválido', { status: 400, code: 'VALIDATION_ERROR' }))
    const onError = vi.fn()
    const { result } = renderHook(() => useSimulation(net, { onError }))
    act(() => result.current.start())
    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'VALIDATION_ERROR' }))
  })

  it('vuelve a simular cuando cambia la red y descarta respuestas obsoletas', async () => {
    api.simulate.mockResolvedValue(remote)
    const { result, rerender } = renderHook(({ n }) => useSimulation(n), { initialProps: { n: net } })
    act(() => result.current.start())
    await waitFor(() => expect(result.current.status).toBe('ok'))
    rerender({ n: { ...net, pipes: [...net.pipes] } })
    await waitFor(() => expect(api.simulate).toHaveBeenCalledTimes(2))
  })

  it('al detener limpia los resultados', async () => {
    api.simulate.mockResolvedValue(remote)
    const { result } = renderHook(() => useSimulation(net))
    act(() => result.current.start())
    await waitFor(() => expect(result.current.status).toBe('ok'))
    act(() => result.current.stop())
    expect(result.current).toMatchObject({ running: false, status: 'idle', result: null, warningCount: 0 })
  })
})
