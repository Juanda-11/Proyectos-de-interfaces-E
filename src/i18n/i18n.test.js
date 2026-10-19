import { describe, it, expect } from 'vitest'
import {
  detectLanguage,
  dictionariesForTests as dict,
  getLanguage,
  setLanguage,
  translate,
} from './index'

describe('translate', () => {
  it('por defecto traduce al español', () => {
    expect(getLanguage()).toBe('es')
    expect(translate('type.tank')).toBe('Tanque')
  })
  it('traduce al inglés al cambiar el idioma', () => {
    setLanguage('en')
    expect(translate('type.tank')).toBe('Tank')
  })
  it('ignora idiomas no soportados', () => {
    setLanguage('fr')
    expect(getLanguage()).toBe('es')
  })
  it('sustituye parámetros y deja los que faltan', () => {
    expect(translate('footer.zoom', { pct: 150 })).toBe('Zoom 150%')
    expect(translate('footer.zoom', {})).toBe('Zoom {pct}%')
  })
  it('elige singular o plural según count', () => {
    expect(translate('topbar.warnings', { count: 1 })).toBe('1 advertencia')
    expect(translate('topbar.warnings', { count: 3 })).toBe('3 advertencias')
    setLanguage('en')
    expect(translate('topbar.warnings', { count: 1 })).toBe('1 warning')
    expect(translate('topbar.warnings', { count: 0 })).toBe('0 warnings')
  })
  it('usa el español si falta la clave en inglés y la propia clave si no existe', () => {
    setLanguage('en')
    expect(translate('clave.inexistente')).toBe('clave.inexistente')
    dict.es['solo.es'] = 'Solo español'
    expect(translate('solo.es')).toBe('Solo español')
    delete dict.es['solo.es']
  })
})

describe('diccionarios', () => {
  it('español e inglés tienen exactamente las mismas claves', () => {
    expect(Object.keys(dict.en).sort()).toEqual(Object.keys(dict.es).sort())
  })
  it('ninguna traducción está vacía y los parámetros coinciden entre idiomas', () => {
    const params = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()
    for (const key of Object.keys(dict.es)) {
      expect(dict.en[key].trim(), key).not.toBe('')
      expect(params(dict.en[key]), key).toEqual(params(dict.es[key]))
    }
  })
})

describe('detectLanguage', () => {
  it.each([
    ['en-US', 'en'],
    ['EN', 'en'],
    ['es-CO', 'es'],
    ['fr-FR', 'es'],
    ['', 'es'],
    [null, 'es'],
  ])('%s -> %s', (nav, lang) => expect(detectLanguage(nav)).toBe(lang))
})
