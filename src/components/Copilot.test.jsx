import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Copilot from './Copilot'

const open = async () => {
  await userEvent.click(screen.getByText('Copiloto IA'))
  return screen.getByLabelText('Orden para el copiloto')
}

describe('Copilot', () => {
  it('se abre con el botón y con Ctrl+K, y se cierra con Escape', async () => {
    render(<Copilot onSubmit={vi.fn()} />)
    await open()
    expect(screen.getByRole('dialog', { name: 'Copiloto IA' })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await userEvent.keyboard('{Control>}k{/Control}')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
  it('envía la orden y muestra la respuesta con su origen', async () => {
    const onSubmit = vi.fn().mockResolvedValue({ message: 'Red generada.', source: 'ai' })
    render(<Copilot onSubmit={onSubmit} />)
    const input = await open()
    await userEvent.type(input, 'Diseñar red para 4 sectores{Enter}')
    expect(onSubmit).toHaveBeenCalledWith('Diseñar red para 4 sectores')
    expect(await screen.findByText('Red generada.')).toBeInTheDocument()
    expect(screen.getByText('IA')).toBeInTheDocument()
    expect(input).toHaveValue('')
  })
  it('muestra «Copiloto analizando» mientras espera y bloquea el campo', async () => {
    let resolve
    const onSubmit = vi.fn(
      () =>
        new Promise((r) => {
          resolve = r
        }),
    )
    render(<Copilot onSubmit={onSubmit} />)
    const input = await open()
    await userEvent.type(input, 'hola{Enter}')
    expect(screen.getByText(/Copiloto analizando/)).toBeInTheDocument()
    expect(input).toBeDisabled()
    resolve({ message: 'listo', source: 'rules' })
    expect(await screen.findByText('listo')).toBeInTheDocument()
    expect(screen.getByText('reglas')).toBeInTheDocument()
    await waitFor(() => expect(input).toBeEnabled())
  })
  it('muestra los errores como respuesta del copiloto', async () => {
    render(
      <Copilot
        onSubmit={vi.fn().mockRejectedValue(new Error('El servidor devolvió una red inválida'))}
      />,
    )
    await userEvent.type(await open(), 'diseña{Enter}')
    expect(await screen.findByText(/red inválida/)).toHaveClass('text-red-200')
  })
  it('ignora órdenes vacías y permite usar las sugerencias', async () => {
    const onSubmit = vi.fn().mockResolvedValue({ message: 'ok' })
    render(<Copilot onSubmit={onSubmit} />)
    const input = await open()
    await userEvent.type(input, '   {Enter}')
    expect(onSubmit).not.toHaveBeenCalled()
    await userEvent.click(screen.getByText('Auditar presiones de la red'))
    expect(onSubmit).toHaveBeenCalledWith('Auditar presiones de la red')
  })

  it('no se rompe si scrollIntoView devuelve un valor (algunos navegadores o extensiones)', async () => {
    const original = Element.prototype.scrollIntoView
    Element.prototype.scrollIntoView = vi.fn(() => Promise.resolve('scrolled'))
    try {
      const onSubmit = vi.fn().mockResolvedValue({ message: 'Hecho', source: 'rules' })
      render(<Copilot onSubmit={onSubmit} />)
      await userEvent.type(await open(), 'hola{Enter}')
      expect(await screen.findByText('Hecho')).toBeInTheDocument()
      await userEvent.click(screen.getByLabelText('Cerrar copiloto'))
      expect(screen.getByText('Copiloto IA')).toBeInTheDocument()
    } finally {
      Element.prototype.scrollIntoView = original
    }
  })
})
