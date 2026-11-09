import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UserMenu, { initials } from './UserMenu'
import { useAuth } from '../auth/AuthProvider'

vi.mock('../auth/AuthProvider', () => ({ useAuth: vi.fn() }))

const logout = vi.fn()
const as = (status, user = null) => useAuth.mockReturnValue({ status, user, logout })
const ana = { id: 'u1', name: 'Ana Pérez', email: 'ana@example.com' }

beforeEach(() => {
  logout.mockReset()
})

describe('initials', () => {
  it.each([
    ['Ana Pérez', 'AP'],
    ['  luis  ', 'L'],
    ['maría de los ángeles', 'MD'],
    ['', '?'],
    [undefined, '?'],
  ])('%s -> %s', (name, expected) => expect(initials(name)).toBe(expected))
})

describe('UserMenu', () => {
  it('no muestra nada si no hay sesión ni modo local', () => {
    for (const status of ['loading', 'anonymous', 'open']) {
      as(status)
      const { container, unmount } = render(<UserMenu />)
      expect(container).toBeEmptyDOMElement()
      unmount()
    }
  })
  it('con sesión muestra las iniciales y abre el menú con nombre y correo', async () => {
    as('authenticated', ana)
    render(<UserMenu />)
    const button = screen.getByRole('button', { name: 'Menú de la cuenta de Ana Pérez' })
    expect(button).toHaveTextContent('AP')
    expect(button).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(button)
    expect(screen.getByRole('menu')).toHaveTextContent('ana@example.com')
    expect(button).toHaveAttribute('aria-expanded', 'true')
  })
  it('cierra la sesión desde el menú', async () => {
    as('authenticated', ana)
    render(<UserMenu />)
    await userEvent.click(screen.getByRole('button', { name: /Menú de la cuenta/ }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Cerrar sesión' }))
    expect(logout).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
  it('el menú se cierra con Escape y al hacer clic fuera', async () => {
    as('authenticated', ana)
    render(<UserMenu />)
    const open = () => userEvent.click(screen.getByRole('button', { name: /Menú de la cuenta/ }))
    await open()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    await open()
    await userEvent.click(document.body)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
  it('en modo local ofrece volver a iniciar sesión', async () => {
    as('local')
    render(<UserMenu />)
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(logout).toHaveBeenCalled()
  })
})
