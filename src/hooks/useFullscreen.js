import { useCallback, useEffect, useState } from 'react'

/** Pantalla completa de la aplicación con la API estándar. `supported` es false si el navegador no la ofrece. */
export function useFullscreen() {
  const [active, setActive] = useState(() => Boolean(document.fullscreenElement))
  useEffect(() => {
    const sync = () => setActive(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])
  const toggle = useCallback(() => {
    const op = document.fullscreenElement
      ? document.exitFullscreen()
      : document.documentElement.requestFullscreen()
    return op?.catch?.(() => {}) // el navegador puede rechazarla (p. ej. dentro de un iframe)
  }, [])
  return { active, toggle, supported: Boolean(document.fullscreenEnabled) }
}
