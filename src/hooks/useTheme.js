import { useCallback, useEffect, useState } from 'react'

const KEY = 'hydrograph-ai:theme'
export const THEMES = ['dark', 'light']

/** Tema guardado por el usuario o, si no hay, el del sistema operativo. */
export function initialTheme() {
  try {
    const saved = localStorage.getItem(KEY)
    if (THEMES.includes(saved)) return saved
  } catch {
    /* almacenamiento bloqueado: se usa el tema del sistema */
  }
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

/** Aplica el tema al documento (atributo en <html> y color de la barra del navegador). */
export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'light' ? '#F1F5F9' : '#0F172A')
}

export function useTheme() {
  const [theme, setTheme] = useState(initialTheme)
  useEffect(() => {
    applyTheme(theme)
    try {
      localStorage.setItem(KEY, theme)
    } catch {
      /* no se puede guardar: el tema solo dura esta sesión */
    }
  }, [theme])
  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [])
  return { theme, setTheme, toggle }
}
