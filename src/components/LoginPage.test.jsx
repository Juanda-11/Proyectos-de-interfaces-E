import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from './LoginPage'
import { AuthProvider } from '../auth/AuthProvider'
import { I18nProvider } from '../i18n/I18nProvider'
import { ApiError, api } from '../api/client'
import { clearToken, getToken } from '../auth/session'

vi.mock('../api/client', async (orig) => ({
  ...(await orig()),
  api: { health: vi.fn(), me: vi.fn(), login: vi.fn(), register: vi.fn() },
}))

const user = { id: 'u1', email: 'ana@example.com', name: 'Ana' }
const server = (extra = {}) => ({
  auth: { enabled: true, registration: true, demo: null, ...extra },
})

async function setup(health = server()) {
  localStorage.setItem('hydrograph-ai:lang', 'es')
  if (health instanceof Error) api.health.mockRejectedValue(health)
  else api.health.mockResolvedValue(health)
  render(
    <I18nProvider>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </I18nProvider>,
  )
  // El proveedor empieza en «loading»; la pantalla ya es utilizable desde el primer pintado
  await screen.findByRole('heading', { name: /Bienvenido de nuevo/ })
  await waitFor(() => expect(api.health).toHaveBeenCalled())
  await act(async () => {})
}
const email = () => screen.getByLabelText('Correo electrónico')
const password = () => screen.getByLabelText('Contraseña')
const submit = () => userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

beforeEach(() => {
  clearToken()
  for (const fn of Object.values(api)) fn.mockReset()
})

describe('inicio de sesión', () => {
  it('valida los campos antes de llamar al servidor', async () => {
    await setup()
    await submit()
    expect(await screen.findByText('Escribe un correo electrónico válido.')).toBeInTheDocument()
    expect(screen.getByText('Escribe tu contraseña.')).toBeInTheDocument()
    expect(email()).toHaveAttribute('aria-invalid', 'true')
    expect(api.login).not.toHaveBeenCalled()
  })
  it('envía las credenciales y guarda la sesión', async () => {
    await setup()
    api.login.mockResolvedValue({ token: 'tok', user })
    await userEvent.type(email(), '  ana@example.com ')
    await userEvent.type(password(), 'Clave-segura-1')
    await submit()
    await waitFor(() => expect(api.login).toHaveBeenCalledWith('ana@example.com', 'Clave-segura-1'))
    await waitFor(() => expect(getToken()).toBe('tok'))
  })
  it('muestra el error del servidor y permite corregirlo', async () => {
    await setup()
    api.login.mockRejectedValue(
      new ApiError('Correo o contraseña incorrectos', { status: 401, code: 'INVALID_CREDENTIALS' }),
    )
    await userEvent.type(email(), 'ana@example.com')
    await userEvent.type(password(), 'mala-clave')
    await submit()
    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos')
    await userEvent.type(password(), '1')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
  it('se envía con Enter y el botón muestra el progreso', async () => {
    await setup()
    let finish
    api.login.mockReturnValue(new Promise((r) => (finish = r)))
    await userEvent.type(email(), 'ana@example.com')
    await userEvent.type(password(), 'Clave-segura-1{Enter}')
    expect(await screen.findByRole('button', { name: /Un momento/ })).toBeDisabled()
    await act(async () => finish({ token: 't', user }))
  })
  it('el ojo muestra y oculta la contraseña', async () => {
    await setup()
    expect(password()).toHaveAttribute('type', 'password')
    await userEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))
    expect(password()).toHaveAttribute('type', 'text')
    await userEvent.click(screen.getByRole('button', { name: 'Ocultar contraseña' }))
    expect(password()).toHaveAttribute('type', 'password')
  })
})

describe('registro', () => {
  it('cambia de pestaña, valida y crea la cuenta', async () => {
    await setup()
    await userEvent.click(screen.getByRole('tab', { name: 'Crear cuenta' }))
    expect(screen.getByRole('heading', { name: 'Crea tu cuenta' })).toBeInTheDocument()
    await userEvent.type(password(), '1234567')
    expect(screen.getByText('Muy corta')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta y entrar' }))
    expect(await screen.findByText('Escribe tu nombre (mínimo 2 caracteres).')).toBeInTheDocument()
    expect(screen.getByText('La contraseña debe tener al menos 8 caracteres.')).toBeInTheDocument()
    expect(api.register).not.toHaveBeenCalled()

    api.register.mockResolvedValue({ token: 'tok2', user })
    await userEvent.type(screen.getByLabelText('Nombre'), 'Ana Pérez')
    await userEvent.type(email(), 'ana@example.com')
    await userEvent.type(password(), '8')
    expect(screen.getByText('Débil')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta y entrar' }))
    await waitFor(() =>
      expect(api.register).toHaveBeenCalledWith('Ana Pérez', 'ana@example.com', '12345678'),
    )
  })
  it('muestra el error si el correo ya existe', async () => {
    await setup()
    await userEvent.click(screen.getByRole('tab', { name: 'Crear cuenta' }))
    api.register.mockRejectedValue(
      new ApiError('Ya existe una cuenta con ese correo', { status: 409, code: 'EMAIL_TAKEN' }),
    )
    await userEvent.type(screen.getByLabelText('Nombre'), 'Ana')
    await userEvent.type(email(), 'ana@example.com')
    await userEvent.type(password(), 'Clave-segura-1')
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta y entrar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Ya existe una cuenta')
  })
  it('sin registro en el servidor oculta las pestañas y lo explica', async () => {
    await setup(server({ registration: false }))
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    expect(screen.getByText(/registro de cuentas no está disponible/i)).toBeInTheDocument()
  })
})

describe('cuenta de demostración y modo local', () => {
  it('ofrece entrar con la cuenta demo cuando el servidor la publica', async () => {
    await setup(server({ demo: { email: 'demo@hydrograph.ai', password: 'Hydro2026!' } }))
    expect(screen.getByText(/demo@hydrograph.ai · Hydro2026!/)).toBeInTheDocument()
    api.login.mockResolvedValue({
      token: 'demo-token',
      user: { id: 'demo', email: 'demo@hydrograph.ai', name: 'Demo' },
    })
    await userEvent.click(
      screen.getByRole('button', { name: 'Entrar con la cuenta de demostración' }),
    )
    await waitFor(() => expect(api.login).toHaveBeenCalledWith('demo@hydrograph.ai', 'Hydro2026!'))
  })
  it('sin demo publicada no muestra el botón', async () => {
    await setup()
    expect(screen.queryByText(/cuenta de demostración/i)).not.toBeInTheDocument()
  })
  it('sin servidor avisa y ofrece reintentar o trabajar en modo local', async () => {
    await setup(new ApiError('sin red', { code: 'NETWORK' }))
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo conectar con el servidor')
    expect(screen.getByRole('button', { name: 'Reintentar conexión' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Trabajar sin cuenta (modo local)' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
  })
})

describe('preferencias', () => {
  it('permite cambiar el idioma y el tema desde la pantalla de acceso', async () => {
    await setup()
    await userEvent.click(screen.getByRole('button', { name: 'English' }))
    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    const before = document.documentElement.dataset.theme
    await userEvent.click(screen.getByRole('button', { name: /Switch to (light|dark) theme/ }))
    expect(document.documentElement.dataset.theme).not.toBe(before)
  })
})
