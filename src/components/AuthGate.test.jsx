import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AuthGate from './AuthGate'
import { useAuth } from '../auth/AuthProvider'

vi.mock('../auth/AuthProvider', () => ({ useAuth: vi.fn() }))
vi.mock('./LoginPage', () => ({ default: () => <p>pantalla de acceso</p> }))

const renderAs = (status) => {
  useAuth.mockReturnValue({ status })
  return render(
    <AuthGate>
      <p>contenido protegido</p>
    </AuthGate>,
  )
}

describe('AuthGate', () => {
  it('mientras comprueba la sesión muestra un indicador y no la aplicación', () => {
    renderAs('loading')
    expect(screen.getByRole('status', { name: 'Comprobando la sesión…' })).toBeInTheDocument()
    expect(screen.queryByText('contenido protegido')).not.toBeInTheDocument()
  })
  it('sin sesión muestra la pantalla de acceso', () => {
    renderAs('anonymous')
    expect(screen.getByText('pantalla de acceso')).toBeInTheDocument()
    expect(screen.queryByText('contenido protegido')).not.toBeInTheDocument()
  })
  it.each(['authenticated', 'open', 'local'])('con estado «%s» muestra la aplicación', (status) => {
    renderAs(status)
    expect(screen.getByText('contenido protegido')).toBeInTheDocument()
  })
})
