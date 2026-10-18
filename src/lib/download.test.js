import { describe, it, expect, vi, afterEach } from 'vitest'
import { downloadBlob, downloadJSON } from './download'

afterEach(() => vi.restoreAllMocks())

describe('download', () => {
  it('crea un enlace temporal con el nombre de archivo y lo pulsa', () => {
    URL.createObjectURL = vi.fn(() => 'blob:x')
    URL.revokeObjectURL = vi.fn()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
      expect(this.download).toBe('red.txt')
      expect(this.href).toBe('blob:x')
    })
    downloadBlob(new Blob(['hola']), 'red.txt')
    expect(click).toHaveBeenCalled()
    expect(document.querySelector('a[download]')).toBeNull()
  })
  it('downloadJSON serializa con sangría', async () => {
    let blob
    URL.createObjectURL = vi.fn((b) => ((blob = b), 'blob:y'))
    URL.revokeObjectURL = vi.fn()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    downloadJSON({ a: 1 }, 'x.json')
    expect(blob.type).toBe('application/json')
    expect(await blob.text()).toBe('{\n  "a": 1\n}')
  })
})
