import { describe, it, expect, vi } from 'vitest'
import { loadNetwork, saveNetwork, clearNetwork } from './storage'
import { makeSectors } from './network'

describe('storage', () => {
  it('guarda y recupera la red', () => {
    const net = makeSectors(2)
    expect(saveNetwork(net)).toBe(true)
    expect(loadNetwork()).toEqual(net)
  })
  it('devuelve null si no hay nada o los datos están dañados', () => {
    expect(loadNetwork()).toBeNull()
    localStorage.setItem('hydrograph-ai:network:v1', '{no es json')
    expect(loadNetwork()).toBeNull()
    localStorage.setItem('hydrograph-ai:network:v1', JSON.stringify({ nodes: 1 }))
    expect(loadNetwork()).toBeNull()
  })
  it('clearNetwork borra la copia guardada', () => {
    saveNetwork(makeSectors(2))
    clearNetwork()
    expect(loadNetwork()).toBeNull()
  })
  it('no falla si el almacenamiento está bloqueado', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied') })
    expect(saveNetwork(makeSectors(2))).toBe(false)
    spy.mockRestore()
    const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied') })
    expect(loadNetwork()).toBeNull()
    get.mockRestore()
  })
})
