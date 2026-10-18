import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TopBar from './TopBar'

const props = (extra = {}) => ({
  running: false, status: 'idle', warnings: 0, busy: null, canUndo: false, canRedo: false,
  onToggle: vi.fn(), onOptimize: vi.fn(), onUndo: vi.fn(), onRedo: vi.fn(),
  onNew: vi.fn(), onImport: vi.fn(), onExportJSON: vi.fn(), onExportEpanet: vi.fn(), ...extra,
})

describe('TopBar', () => {
  it('muestra red estable y el botón Simular', () => {
    render(<TopBar {...props()} />)
    expect(screen.getByRole('status')).toHaveTextContent('Red estable')
    expect(screen.getByText('Simular Flujo')).toBeInTheDocument()
  })
  it('pluraliza las advertencias', () => {
    const { rerender } = render(<TopBar {...props({ warnings: 1 })} />)
    expect(screen.getByRole('status')).toHaveTextContent('1 advertencia')
    expect(screen.getByRole('status')).not.toHaveTextContent('advertencias')
    rerender(<TopBar {...props({ warnings: 3 })} />)
    expect(screen.getByRole('status')).toHaveTextContent('3 advertencias')
  })
  it('alterna simulación y muestra Detener', async () => {
    const p = props({ running: true })
    render(<TopBar {...p} />)
    await userEvent.click(screen.getByText('Detener'))
    expect(p.onToggle).toHaveBeenCalled()
    expect(screen.getByRole('status')).toHaveTextContent('simulando')
  })
  it('indica el modo local cuando no hay servidor', () => {
    render(<TopBar {...props({ running: true, status: 'offline' })} />)
    expect(screen.getByText('Modo local')).toBeInTheDocument()
  })
  it('deshacer/rehacer respetan su disponibilidad', async () => {
    const p = props({ canUndo: true })
    render(<TopBar {...p} />)
    expect(screen.getByLabelText('Rehacer (Ctrl+Y)')).toBeDisabled()
    await userEvent.click(screen.getByLabelText('Deshacer (Ctrl+Z)'))
    expect(p.onUndo).toHaveBeenCalled()
  })
  it('bloquea Optimizar y Archivo mientras hay una operación en curso', () => {
    render(<TopBar {...props({ busy: 'optimize' })} />)
    expect(screen.getByText('Optimizar').closest('button')).toBeDisabled()
    expect(screen.getByText('Archivo').closest('button')).toBeDisabled()
  })
  it('el botón Optimizar dispara la acción', async () => {
    const p = props()
    render(<TopBar {...p} />)
    await userEvent.click(screen.getByText('Optimizar'))
    expect(p.onOptimize).toHaveBeenCalled()
  })
})
