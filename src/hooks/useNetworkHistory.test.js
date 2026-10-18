import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNetworkHistory } from './useNetworkHistory'

const setup = () => renderHook(() => useNetworkHistory({ n: 0 }))
const inc = (net) => ({ n: net.n + 1 })

describe('useNetworkHistory', () => {
  it('empieza sin historial', () => {
    const { result } = setup()
    expect(result.current).toMatchObject({ net: { n: 0 }, canUndo: false, canRedo: false })
  })

  it('deshace y rehace', () => {
    const { result } = setup()
    act(() => {
      result.current.checkpoint()
      result.current.update(inc)
    })
    expect(result.current.net.n).toBe(1)
    act(() => result.current.undo())
    expect(result.current).toMatchObject({ net: { n: 0 }, canUndo: false, canRedo: true })
    act(() => result.current.redo())
    expect(result.current.net.n).toBe(1)
  })

  it('un gesto con muchos cambios es un solo paso de deshacer', () => {
    const { result } = setup()
    act(() => {
      result.current.checkpoint()
      for (let i = 0; i < 5; i++) result.current.update(inc)
    })
    act(() => result.current.undo())
    expect(result.current.net.n).toBe(0)
  })

  it('un cambio nuevo descarta el futuro', () => {
    const { result } = setup()
    act(() => {
      result.current.checkpoint()
      result.current.update(inc)
    })
    act(() => result.current.undo())
    act(() => {
      result.current.checkpoint()
      result.current.update(inc)
    })
    expect(result.current.canRedo).toBe(false)
  })

  it('replace registra historial por defecto y puede reiniciarlo', () => {
    const { result } = setup()
    act(() => result.current.replace({ n: 9 }))
    expect(result.current.canUndo).toBe(true)
    act(() => result.current.replace({ n: 5 }, { record: false }))
    expect(result.current).toMatchObject({ net: { n: 5 }, canUndo: false })
  })

  it('limita el historial a 50 pasos', () => {
    const { result } = setup()
    for (let i = 0; i < 60; i++)
      act(() => {
        result.current.checkpoint()
        result.current.update(inc)
      })
    let steps = 0
    while (result.current.canUndo) {
      act(() => result.current.undo())
      steps++
    }
    expect(steps).toBe(50)
  })

  it('undo/redo sin historial no hacen nada', () => {
    const { result } = setup()
    act(() => {
      result.current.undo()
      result.current.redo()
    })
    expect(result.current.net.n).toBe(0)
  })
})
