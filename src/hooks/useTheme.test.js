import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { applyTheme, initialTheme, useTheme } from './useTheme'

const mockSystem = (light) =>
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: light }))
afterEach(() => {
  vi.unstubAllGlobals()
  delete document.documentElement.dataset.theme
})

describe('initialTheme', () => {
  it('usa el tema del sistema si no hay uno guardado', () => {
    mockSystem(true)
    expect(initialTheme()).toBe('light')
    mockSystem(false)
    expect(initialTheme()).toBe('dark')
  })
  it('prefiere el tema guardado y descarta valores inválidos', () => {
    mockSystem(false)
    localStorage.setItem('hydrograph-ai:theme', 'light')
    expect(initialTheme()).toBe('light')
    localStorage.setItem('hydrograph-ai:theme', 'rosa')
    expect(initialTheme()).toBe('dark')
  })
  it('es oscuro si el navegador no soporta matchMedia', () => {
    vi.stubGlobal('matchMedia', undefined)
    expect(initialTheme()).toBe('dark')
  })
})

describe('useTheme', () => {
  it('aplica el tema al documento y lo guarda', () => {
    mockSystem(false)
    const { result } = renderHook(() => useTheme())
    expect(document.documentElement.dataset.theme).toBe('dark')
    act(() => result.current.toggle())
    expect(result.current.theme).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem('hydrograph-ai:theme')).toBe('light')
    act(() => result.current.toggle())
    expect(document.documentElement.dataset.theme).toBe('dark')
  })
  it('actualiza el color de la barra del navegador', () => {
    const meta = document.createElement('meta')
    meta.name = 'theme-color'
    document.head.append(meta)
    applyTheme('light')
    expect(meta.content).toBe('#F1F5F9')
    applyTheme('dark')
    expect(meta.content).toBe('#0F172A')
    meta.remove()
  })
  it('no falla si el almacenamiento está bloqueado', () => {
    mockSystem(false)
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied')
    })
    const { result } = renderHook(() => useTheme())
    expect(() => act(() => result.current.toggle())).not.toThrow()
    spy.mockRestore()
  })
})
