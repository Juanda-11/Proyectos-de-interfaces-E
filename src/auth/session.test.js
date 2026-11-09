import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  clearToken,
  decodeToken,
  getToken,
  notifyUnauthorized,
  onUnauthorized,
  setToken,
} from './session'

const b64 = (o) =>
  btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const jwt = (payload) => `${b64({ alg: 'HS256' })}.${b64(payload)}.firma`

beforeEach(() => clearToken())

describe('token almacenado', () => {
  it('guarda, recupera y borra el token', () => {
    expect(getToken()).toBeNull()
    setToken('abc')
    expect(getToken()).toBe('abc')
    expect(localStorage.getItem('hydrograph-ai:token')).toBe('abc')
    clearToken()
    expect(getToken()).toBeNull()
    expect(localStorage.getItem('hydrograph-ai:token')).toBeNull()
  })
  it('sigue funcionando en memoria si el almacenamiento está bloqueado', () => {
    const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied')
    })
    const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    const del = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('denied')
    })
    setToken('en-memoria')
    expect(getToken()).toBe('en-memoria')
    clearToken()
    expect(getToken()).toBeNull()
    for (const spy of [set, get, del]) spy.mockRestore()
  })
})

describe('onUnauthorized', () => {
  it('avisa al manejador registrado y se puede dar de baja', () => {
    const handler = vi.fn()
    const off = onUnauthorized(handler)
    notifyUnauthorized()
    expect(handler).toHaveBeenCalledTimes(1)
    off()
    notifyUnauthorized()
    expect(handler).toHaveBeenCalledTimes(1)
  })
  it('darse de baja no quita un manejador más reciente', () => {
    const a = vi.fn()
    const b = vi.fn()
    const offA = onUnauthorized(a)
    onUnauthorized(b)
    offA()
    notifyUnauthorized()
    expect(b).toHaveBeenCalled()
    expect(a).not.toHaveBeenCalled()
  })
})

describe('decodeToken', () => {
  const future = Math.floor(Date.now() / 1000) + 3600
  it('extrae el usuario y la caducidad', () => {
    expect(decodeToken(jwt({ sub: 'u1', email: 'a@b.c', name: 'Ana', exp: future }))).toEqual({
      user: { id: 'u1', email: 'a@b.c', name: 'Ana' },
      expired: false,
    })
  })
  it('detecta tokens caducados', () => {
    expect(decodeToken(jwt({ sub: 'u1', exp: 10 })).expired).toBe(true)
  })
  it.each([[''], ['abc'], ['a.b.c'], [jwt({ nombre: 'sin sub' })], [undefined]])(
    'devuelve null para %s',
    (t) => {
      expect(decodeToken(t)).toBeNull()
    },
  )
})
