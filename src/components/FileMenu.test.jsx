import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FileMenu from './FileMenu'

const setup = (extra = {}) => {
  const p = {
    onNew: vi.fn(),
    onImport: vi.fn(),
    onExportJSON: vi.fn(),
    onExportEpanet: vi.fn(),
    onExportSVG: vi.fn(),
    onExportPNG: vi.fn(),
    ...extra,
  }
  render(<FileMenu {...p} />)
  return p
}

describe('FileMenu', () => {
  it('abre el menú y ejecuta una acción cerrándolo', async () => {
    const p = setup()
    await userEvent.click(screen.getByText('Archivo'))
    await userEvent.click(screen.getByRole('menuitem', { name: /Exportar JSON/ }))
    expect(p.onExportJSON).toHaveBeenCalled()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
  it('ofrece exportar la imagen en SVG y PNG', async () => {
    const p = setup()
    await userEvent.click(screen.getByText('Archivo'))
    await userEvent.click(screen.getByRole('menuitem', { name: /SVG/ }))
    expect(p.onExportSVG).toHaveBeenCalled()
    await userEvent.click(screen.getByText('Archivo'))
    await userEvent.click(screen.getByRole('menuitem', { name: /PNG/ }))
    expect(p.onExportPNG).toHaveBeenCalled()
  })
  it('se cierra con Escape y al hacer clic fuera', async () => {
    setup()
    await userEvent.click(screen.getByText('Archivo'))
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    await userEvent.click(screen.getByText('Archivo'))
    await userEvent.click(document.body)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
  it('importar abre el selector y entrega el archivo elegido', async () => {
    const p = setup()
    const input = screen.getByLabelText('Importar red desde archivo JSON')
    const click = vi.spyOn(input, 'click')
    await userEvent.click(screen.getByText('Archivo'))
    await userEvent.click(screen.getByRole('menuitem', { name: /Importar/ }))
    expect(click).toHaveBeenCalled()
    const file = new File(['{}'], 'red.json', { type: 'application/json' })
    fireEvent.change(input, { target: { files: [file] } })
    expect(p.onImport).toHaveBeenCalledWith(file)
  })
  it('marca el estado expandido para lectores de pantalla', async () => {
    setup()
    const btn = screen.getByText('Archivo').closest('button')
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
  })
})
