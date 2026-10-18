import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider, useToasts } from './useToasts'
import Toasts from '../components/Toasts'

function Demo() {
  const t = useToasts()
  return (
    <>
      <button onClick={() => t.success('Guardado')}>ok</button>
      <button onClick={() => t.error('Falló')}>fail</button>
      <Toasts />
    </>
  )
}
const setup = () =>
  render(
    <ToastProvider>
      <Demo />
    </ToastProvider>,
  )
afterEach(() => vi.useRealTimers())

describe('toasts', () => {
  it('muestra un aviso y lo cierra a mano', async () => {
    setup()
    await userEvent.click(screen.getByText('ok'))
    expect(screen.getByRole('status')).toHaveTextContent('Guardado')
    await userEvent.click(screen.getByLabelText('Cerrar aviso'))
    expect(screen.queryByText('Guardado')).not.toBeInTheDocument()
  })
  it('los errores usan role=alert', async () => {
    setup()
    await userEvent.click(screen.getByText('fail'))
    expect(screen.getByRole('alert')).toHaveTextContent('Falló')
  })
  it('se cierra solo tras unos segundos', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    setup()
    await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(screen.getByText('ok'))
    expect(screen.getByText('Guardado')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(5000))
    expect(screen.queryByText('Guardado')).not.toBeInTheDocument()
  })
  it('mantiene como máximo 4 avisos', async () => {
    setup()
    for (let i = 0; i < 6; i++) await userEvent.click(screen.getByText('ok'))
    expect(screen.getAllByRole('status')).toHaveLength(4)
  })
  it('falla con un mensaje claro fuera del proveedor', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Demo />)).toThrow(/ToastProvider/)
    spy.mockRestore()
  })
})
