import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ErrorBoundary from './ErrorBoundary'
import { saveNetwork, loadNetwork } from '../lib/storage'
import { makeSectors } from '../lib/network'

let shouldThrow
const Bomb = () => {
  if (shouldThrow) throw new Error('boom')
  return <p>todo bien</p>
}

beforeEach(() => {
  shouldThrow = true
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => vi.restoreAllMocks())

describe('ErrorBoundary', () => {
  it('muestra los hijos si no hay error', () => {
    shouldThrow = false
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    )
    expect(screen.getByText('todo bien')).toBeInTheDocument()
  })
  it('muestra una pantalla de error con el mensaje', () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Algo salió mal')
    expect(screen.getByText('boom')).toBeInTheDocument()
  })
  it('Reintentar vuelve a renderizar los hijos', async () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    )
    shouldThrow = false
    await userEvent.click(screen.getByText('Reintentar'))
    expect(screen.getByText('todo bien')).toBeInTheDocument()
  })
  it('Reiniciar borra la red guardada y recarga la página', async () => {
    const reload = vi.fn()
    vi.stubGlobal('location', { ...window.location, reload })
    saveNetwork(makeSectors(2))
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    )
    await userEvent.click(screen.getByText('Reiniciar'))
    expect(loadNetwork()).toBeNull()
    expect(reload).toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})
