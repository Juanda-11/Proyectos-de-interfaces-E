import { translate as t } from '../i18n'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Valida el formulario de acceso. Devuelve `{ campo: mensaje }`; vacío si todo es correcto. */
export function validateAuthForm(mode, { name, email, password }) {
  const errors = {}
  if (mode === 'register' && name.trim().length < 2) errors.name = t('auth.error.name')
  if (!EMAIL.test(email.trim())) errors.email = t('auth.error.email')
  if (!password) errors.password = t('auth.error.passwordRequired')
  else if (mode === 'register' && password.length < 8)
    errors.password = t('auth.error.passwordShort')
  return errors
}

/** Fortaleza orientativa de una contraseña: 0 (insuficiente) a 3 (buena). */
export function passwordStrength(password) {
  if (password.length < 8) return 0
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length
  if (classes >= 3 && password.length >= 12) return 3
  return classes >= 2 ? 2 : 1
}
