import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// jsdom no implementa la captura de puntero que usa el lienzo
Element.prototype.setPointerCapture ??= () => {}
Element.prototype.releasePointerCapture ??= () => {}

afterEach(() => {
  cleanup()
  localStorage.clear()
})
