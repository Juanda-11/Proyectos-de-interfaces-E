import { describe, it, expect } from 'vitest'
import { passwordStrength, validateAuthForm } from './validation'
import { setLanguage } from '../i18n'

const ok = { name: 'Ana Pérez', email: 'ana@example.com', password: 'Clave-segura-1' }

describe('validateAuthForm', () => {
  it('acepta datos válidos de inicio de sesión y de registro', () => {
    expect(validateAuthForm('login', ok)).toEqual({})
    expect(validateAuthForm('register', ok)).toEqual({})
  })
  it('el inicio de sesión no pide nombre ni longitud mínima de la contraseña', () => {
    expect(validateAuthForm('login', { name: '', email: 'a@b.co', password: 'x' })).toEqual({})
  })
  it.each([
    ['sin arroba', 'ana.example.com'],
    ['sin dominio', 'ana@'],
    ['con espacios', 'ana @b.co'],
    ['vacío', ''],
  ])('rechaza un correo %s', (_n, email) => {
    expect(validateAuthForm('login', { ...ok, email })).toHaveProperty('email')
  })
  it('en el registro exige nombre y contraseña de al menos 8 caracteres', () => {
    expect(validateAuthForm('register', { ...ok, name: ' A ' })).toHaveProperty('name')
    expect(validateAuthForm('register', { ...ok, password: '1234567' })).toHaveProperty('password')
    expect(validateAuthForm('login', { ...ok, password: '' })).toHaveProperty('password')
  })
  it('los mensajes siguen el idioma activo', () => {
    expect(validateAuthForm('login', { ...ok, email: 'x' }).email).toMatch(/correo/i)
    setLanguage('en')
    expect(validateAuthForm('login', { ...ok, email: 'x' }).email).toMatch(/email/i)
  })
})

describe('passwordStrength', () => {
  it.each([
    ['corta', 'Ab1!', 0],
    ['solo minúsculas', 'abcdefgh', 1],
    ['dos clases', 'abcdefg1', 2],
    ['tres clases pero corta', 'Abcdefg1', 2],
    ['larga y variada', 'Clave-segura-1', 3],
  ])('%s -> %i', (_n, pw, score) => expect(passwordStrength(pw)).toBe(score))
})
