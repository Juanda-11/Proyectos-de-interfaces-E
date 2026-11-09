import { useEffect } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from './AuthProvider'
import { ApiError, api } from '../api/client'
import { clearToken, getToken, notifyUnauthorized, setToken } from './session'

vi.mock('../api/client', async (orig) => ({
  ...(await orig()),
  api: { health: vi.fn(), me: vi.fn(), login: vi.fn(), register: vi.fn() },
}))

const b64 = (o) => btoa(JSON.stringify(o)).replace(/=+$/, '')
const jwt = (payload) => `${b64({ alg: 'HS256' })}.${b64(payload)}.firma`
const future = () => Math.floor(Date.now() / 1000) + 3600
const user = { id: 'u1', email: 'ana@example.com', name: 'Ana' }
const health = (auth = {}) => ({ auth: { enabled: true, registration: true, demo: null, ...auth } })
const down = () => new ApiError('sin red', { code: 'NETWORK' })

const box = {}
function Probe() {
  const ctx = useAuth()
  useEffect(() => {
    box.ctx = ctx
  })
  return (
    <p data-testid="state">
      {ctx.status}|{ctx.user?.name ?? '-'}|{String(ctx.reachable)}|{String(ctx.expired)}
    </p>
  )
}
const setup = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  )
const state = () => screen.getByTestId('state').textContent
const settled = () => waitFor(() => expect(state()).not.toMatch(/^loading/))

beforeEach(() => {
  clearToken()
  for (const fn of Object.values(api)) fn.mockReset()
  api.health.mockResolvedValue(health())
})

describe('arranque', () => {
  it('sin token pide iniciar sesión y conserva lo que informa el servidor', async () => {
    api.health.mockResolvedValue(health({ demo: { email: 'd@x.y', password: 'p' } }))
    setup()
    expect(state()).toMatch(/^loading/)
    await settled()
    expect(state()).toBe('anonymous|-|true|false')
    expect(box.ctx.server.demo.email).toBe('d@x.y')
  })
  it('con un token válido consulta /me y entra', async () => {
    setToken('tok')
    api.me.mockResolvedValue({ user })
    setup()
    await settled()
    expect(state()).toBe('authenticated|Ana|true|false')
  })
  it('si el servidor rechaza el token, lo borra y pide iniciar sesión', async () => {
    setToken('viejo')
    api.me.mockRejectedValue(new ApiError('no', { status: 401, code: 'UNAUTHORIZED' }))
    setup()
    await settled()
    expect(state()).toMatch(/^anonymous/)
    expect(getToken()).toBeNull()
  })
  it('con la autenticación desactivada en el servidor entra directamente', async () => {
    api.health.mockResolvedValue(health({ enabled: false }))
    setup()
    await settled()
    expect(state()).toMatch(/^open/)
    expect(api.me).not.toHaveBeenCalled()
  })
  it('sin conexión acepta un token guardado que no ha caducado', async () => {
    setToken(jwt({ sub: 'u1', email: user.email, name: 'Ana', exp: future() }))
    api.health.mockRejectedValue(down())
    setup()
    await settled()
    expect(state()).toBe('authenticated|Ana|false|false')
  })
  it('sin conexión rechaza un token caducado o ilegible', async () => {
    setToken(jwt({ sub: 'u1', name: 'Ana', exp: 10 }))
    api.health.mockRejectedValue(down())
    setup()
    await settled()
    expect(state()).toBe('anonymous|-|false|true')
    expect(getToken()).toBeNull()
  })
  it('si /me falla por red tras responder el health, recurre al token guardado', async () => {
    setToken(jwt({ sub: 'u1', name: 'Ana', exp: future() }))
    api.me.mockRejectedValue(down())
    setup()
    await settled()
    expect(state()).toBe('authenticated|Ana|false|false')
  })
  it('sin conexión y sin token queda en anonymous y permite reintentar', async () => {
    api.health.mockRejectedValueOnce(down())
    setup()
    await settled()
    expect(state()).toBe('anonymous|-|false|false')
    await act(() => box.ctx.retry())
    expect(state()).toBe('anonymous|-|true|false')
  })
})

describe('acciones', () => {
  it('login guarda el token y entra; los errores se propagan al formulario', async () => {
    setup()
    await settled()
    api.login.mockRejectedValueOnce(
      new ApiError('Correo o contraseña incorrectos', { status: 401, code: 'INVALID_CREDENTIALS' }),
    )
    await expect(act(() => box.ctx.login('a@b.c', 'mala'))).rejects.toThrow(/incorrectos/)
    expect(state()).toMatch(/^anonymous/)
    api.login.mockResolvedValueOnce({ token: 'tok-nuevo', user })
    await act(() => box.ctx.login('ana@example.com', 'Clave-segura-1'))
    expect(state()).toBe('authenticated|Ana|true|false')
    expect(getToken()).toBe('tok-nuevo')
  })
  it('register crea la cuenta e inicia sesión', async () => {
    setup()
    await settled()
    api.register.mockResolvedValue({ token: 't2', user })
    await act(() => box.ctx.register('Ana', 'ana@example.com', 'Clave-segura-1'))
    expect(api.register).toHaveBeenCalledWith('Ana', 'ana@example.com', 'Clave-segura-1')
    expect(state()).toMatch(/^authenticated/)
  })
  it('logout borra la sesión', async () => {
    setToken('tok')
    api.me.mockResolvedValue({ user })
    setup()
    await waitFor(() => expect(state()).toMatch(/^authenticated/))
    act(() => box.ctx.logout())
    expect(state()).toMatch(/^anonymous/)
    expect(getToken()).toBeNull()
  })
  it('un 401 en cualquier petición cierra la sesión y lo indica', async () => {
    setToken('tok')
    api.me.mockResolvedValue({ user })
    setup()
    await waitFor(() => expect(state()).toMatch(/^authenticated/))
    act(() => notifyUnauthorized())
    expect(state()).toBe('anonymous|-|true|true')
    expect(getToken()).toBeNull()
  })
  it('enterLocal permite trabajar sin cuenta', async () => {
    setup()
    await settled()
    act(() => box.ctx.enterLocal())
    expect(state()).toMatch(/^local/)
  })
})

describe('useAuth sin proveedor', () => {
  it('se comporta como una aplicación sin autenticación', async () => {
    render(<Probe />)
    expect(state()).toMatch(/^open/)
    await userEvent.setup().click(document.body)
    expect(await box.ctx.login()).toBeUndefined()
  })
})
