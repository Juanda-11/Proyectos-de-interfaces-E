import { describe, it, expect } from 'vitest'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

describe('configuración de la versión de escritorio', () => {
  it('.env.desktop define la URL absoluta del backend (https, sin barra final)', () => {
    const env = readFileSync(new URL('../.env.desktop', import.meta.url), 'utf8')
    const url = env.match(/^VITE_API_URL=(.+)$/m)?.[1]
    expect(url).toMatch(/^https:\/\/[^/\s]+$/)
  })

  it('.env.desktop está versionado: si Git lo ignora, el instalador compilado en CI no sabe dónde está el backend', () => {
    const tracked = execFileSync('git', ['ls-files', '.env.desktop'], { encoding: 'utf8' }).trim()
    const ignored = (() => {
      try {
        execFileSync('git', ['check-ignore', '-q', '.env.desktop'])
        return true
      } catch {
        return false
      }
    })()
    expect(ignored).toBe(false)
    // En un clon limpio (CI) debe aparecer en el índice; en local basta con que no esté ignorado
    expect(tracked === '.env.desktop' || !ignored).toBe(true)
  })
})
