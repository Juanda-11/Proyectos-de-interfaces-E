import es from './es'
import en from './en'

/**
 * Traducción mínima (español/inglés) sin dependencias. El idioma activo vive en el módulo para
 * que también lo usen el código que no es React (cliente HTTP, informes, validación…); el
 * `I18nProvider` lo mantiene sincronizado y vuelve a pintar la interfaz al cambiarlo.
 */
export const LANGUAGES = ['es', 'en']
const dictionaries = { es, en }
let current = 'es'

export const getLanguage = () => current
export function setLanguage(lang) {
  if (LANGUAGES.includes(lang)) current = lang
}

/** Idioma del navegador: inglés si empieza por «en»; en cualquier otro caso, español. */
export const detectLanguage = (navigatorLanguage = globalThis.navigator?.language) =>
  String(navigatorLanguage ?? '')
    .toLowerCase()
    .startsWith('en')
    ? 'en'
    : 'es'

/**
 * Busca `key` en el idioma activo (con respaldo en español) y sustituye `{nombre}` por los
 * parámetros. Con `count` elige la variante `key.one` o `key.other` si existen.
 */
export function translate(key, params) {
  let k = key
  if (params && typeof params.count === 'number') {
    const plural = `${key}.${params.count === 1 ? 'one' : 'other'}`
    if (plural in dictionaries[current] || plural in dictionaries.es) k = plural
  }
  const raw = dictionaries[current][k] ?? dictionaries.es[k] ?? key
  return params ? raw.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? `{${name}}`)) : raw
}

export const dictionariesForTests = dictionaries
