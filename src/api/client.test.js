import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { api, ApiError } from './client'

const net = { nodes: [{ id: 'A' }], pipes: [], selected: 'ignorado' }
const json = (data, status = 200) => ({
  ok: status < 400,
  status,
  json: async () => data,
  blob: async () => new Blob(['x']),
})

beforeEach(() => vi.stubGlobal('fetch', vi.fn()))
afterEach(() => vi.unstubAllGlobals())

describe('api client', () => {
  it('envía solo nodos y tuberías a /api/simulate', async () => {
    fetch.mockResolvedValue(json({ ok: 1 }))
    expect(await api.simulate(net)).toEqual({ ok: 1 })
    const [url, init] = fetch.mock.calls[0]
    expect(url).toBe('/api/simulate')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual({ nodes: [{ id: 'A' }], pipes: [] })
  })

  it('el copiloto incluye la orden y la red actual', async () => {
    fetch.mockResolvedValue(json({}))
    await api.copilot('auditar', net)
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
      prompt: 'auditar',
      network: { nodes: [{ id: 'A' }], pipes: [] },
    })
  })

  it('balance envía la red a /api/balance', async () => {
    fetch.mockResolvedValue(json({ totalDemand: 16 }))
    expect(await api.balance(net)).toEqual({ totalDemand: 16 })
    expect(fetch.mock.calls[0][0]).toBe('/api/balance')
  })

  it('health usa GET sin cuerpo', async () => {
    fetch.mockResolvedValue(json({ status: 'ok' }))
    await api.health()
    expect(fetch.mock.calls[0][1]).toMatchObject({ method: 'GET', body: undefined })
  })

  it('exportEpanet devuelve un Blob', async () => {
    fetch.mockResolvedValue(json({}))
    expect(await api.exportEpanet(net)).toBeInstanceOf(Blob)
  })

  it('convierte errores del backend en ApiError con código y detalle', async () => {
    fetch.mockResolvedValue(
      json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Datos inválidos',
            details: [{ path: 'nodes' }],
          },
        },
        400,
      ),
    )
    const err = await api.simulate(net).catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err).toMatchObject({ status: 400, code: 'VALIDATION_ERROR', message: 'Datos inválidos' })
    expect(err.details).toHaveLength(1)
  })

  it('un 404 que no viene de la API se marca como NO_API con una pista de configuración', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => Promise.reject(new Error('html')),
    })
    const err = await api.simulate(net).catch((e) => e)
    expect(err).toMatchObject({ status: 404, code: 'NO_API' })
    expect(err.message).toMatch(/VITE_API_URL/)
  })

  it('un 404 JSON de la propia API conserva su código', async () => {
    fetch.mockResolvedValue(
      json({ error: { code: 'NOT_FOUND', message: 'Ruta no encontrada' } }, 404),
    )
    expect(await api.simulate(net).catch((e) => e.code)).toBe('NOT_FOUND')
  })

  it('tolera respuestas de error sin JSON', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => Promise.reject(new Error('html')),
    })
    const err = await api.simulate(net).catch((e) => e)
    expect(err).toMatchObject({
      status: 500,
      code: 'HTTP_ERROR',
      message: 'Error 500 del servidor',
    })
  })

  it('distingue fallo de red y tiempo agotado', async () => {
    fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    expect(await api.simulate(net).catch((e) => e.code)).toBe('NETWORK')
    fetch.mockRejectedValueOnce(Object.assign(new Error('t'), { name: 'TimeoutError' }))
    expect(await api.simulate(net).catch((e) => e.code)).toBe('TIMEOUT')
  })
})
