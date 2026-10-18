import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useBackendStatus } from './useBackendStatus'
import { api } from '../api/client'

vi.mock('../api/client', () => ({ api: { health: vi.fn() } }))
beforeEach(() => {
  api.health.mockReset()
})

describe('useBackendStatus', () => {
  it('empieza comprobando y pasa a online con el motor de IA', async () => {
    api.health.mockResolvedValue({ status: 'ok', ai: 'claude-haiku-5-5' })
    const { result } = renderHook(() => useBackendStatus())
    expect(result.current.state).toBe('checking')
    await waitFor(() => expect(result.current).toEqual({ state: 'online', ai: 'claude-haiku-5-5' }))
  })
  it('pasa a offline si falla', async () => {
    api.health.mockRejectedValue(new Error('x'))
    const { result } = renderHook(() => useBackendStatus())
    await waitFor(() => expect(result.current.state).toBe('offline'))
  })
})
