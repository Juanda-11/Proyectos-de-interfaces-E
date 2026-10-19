import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { LANGUAGES, detectLanguage, getLanguage, setLanguage, translate } from './index'

const KEY = 'hydrograph-ai:lang'
const I18nContext = createContext(null)

function initialLanguage() {
  try {
    const saved = localStorage.getItem(KEY)
    if (LANGUAGES.includes(saved)) return saved
  } catch {
    /* almacenamiento bloqueado: se usa el idioma del navegador */
  }
  return detectLanguage()
}

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(initialLanguage)
  // El módulo debe conocer el idioma antes de que los hijos se pinten
  setLanguage(lang)

  useEffect(() => {
    document.documentElement.lang = lang
    try {
      localStorage.setItem(KEY, lang)
    } catch {
      /* no se puede guardar: el idioma solo dura esta sesión */
    }
  }, [lang])

  const change = useCallback((next) => LANGUAGES.includes(next) && setLang(next), [])
  // `t` cambia de identidad con el idioma para que los efectos y memos que la usan se recalculen
  const value = useMemo(
    () => ({ lang, setLang: change, t: (key, params) => translate(key, params) }),
    [lang, change],
  )
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

/** `{ lang, setLang, t }`. Fuera del proveedor usa el idioma activo del módulo (español por defecto). */
export function useI18n() {
  return useContext(I18nContext) ?? { lang: getLanguage(), setLang: setLanguage, t: translate }
}
