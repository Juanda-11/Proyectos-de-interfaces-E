import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFullscreen } from './useFullscreen'

const setFs = (el) =>
  Object.defineProperty(document, 'fullscreenElement', { value: el, configurable: true })
afterEach(() => {
  setFs(null)
  delete document.fullscreenEnabled
  delete document.exitFullscreen
  delete document.documentElement.requestFullscreen
})

describe('useFullscreen', () => {
  it('indica si el navegador lo soporta', () => {
    expect(renderHook(() => useFullscreen()).result.current.supported).toBe(false)
    Object.defineProperty(document, 'fullscreenEnabled', { value: true, configurable: true })
    expect(renderHook(() => useFullscreen()).result.current.supported).toBe(true)
  })
  it('entra en pantalla completa y sigue los cambios del navegador', () => {
    document.documentElement.requestFullscreen = vi.fn().mockResolvedValue()
    const { result } = renderHook(() => useFullscreen())
    act(() => {
      result.current.toggle()
    })
    expect(document.documentElement.requestFullscreen).toHaveBeenCalled()
    act(() => {
      setFs(document.documentElement)
      document.dispatchEvent(new Event('fullscreenchange'))
    })
    expect(result.current.active).toBe(true)
  })
  it('sale de pantalla completa si ya está activa y tolera el rechazo', async () => {
    setFs(document.documentElement)
    document.exitFullscreen = vi.fn().mockRejectedValue(new Error('no'))
    const { result } = renderHook(() => useFullscreen())
    expect(result.current.active).toBe(true)
    await act(async () => {
      await result.current.toggle()
    })
    expect(document.exitFullscreen).toHaveBeenCalled()
  })
})
