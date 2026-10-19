import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nProvider, useI18n } from './I18nProvider'
import { getLanguage } from './index'

function Probe() {
  const { t, lang, setLang } = useI18n()
  return (
    <>
      <p>{t('type.tank')}</p>
      <p data-testid="lang">{lang}</p>
      <button onClick={() => setLang('en')}>en</button>
      <button onClick={() => setLang('xx')}>xx</button>
    </>
  )
}
afterEach(() => {
  vi.unstubAllGlobals()
  document.documentElement.lang = ''
})

describe('I18nProvider', () => {
  it('sin proveedor usa el idioma activo del módulo', () => {
    render(<Probe />)
    expect(screen.getByText('Tanque')).toBeInTheDocument()
  })
  it('arranca con el idioma del navegador y lo cambia con setLang', async () => {
    vi.stubGlobal('navigator', { language: 'en-GB' })
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    )
    expect(screen.getByText('Tank')).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('en')
  })
  it('prefiere el idioma guardado, persiste los cambios y actualiza <html lang>', async () => {
    localStorage.setItem('hydrograph-ai:lang', 'es')
    vi.stubGlobal('navigator', { language: 'en-US' })
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    )
    expect(screen.getByTestId('lang')).toHaveTextContent('es')
    await userEvent.click(screen.getByText('en'))
    expect(screen.getByText('Tank')).toBeInTheDocument()
    expect(getLanguage()).toBe('en')
    expect(localStorage.getItem('hydrograph-ai:lang')).toBe('en')
    expect(document.documentElement.lang).toBe('en')
  })
  it('ignora idiomas no soportados', async () => {
    vi.stubGlobal('navigator', { language: 'es-CO' })
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    )
    await userEvent.click(screen.getByText('xx'))
    expect(screen.getByTestId('lang')).toHaveTextContent('es')
  })
  it('funciona aunque el almacenamiento esté bloqueado', () => {
    const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied')
    })
    expect(() =>
      render(
        <I18nProvider>
          <Probe />
        </I18nProvider>,
      ),
    ).not.toThrow()
    get.mockRestore()
    set.mockRestore()
  })
})
