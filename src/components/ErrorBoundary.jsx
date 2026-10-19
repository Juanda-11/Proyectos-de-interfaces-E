import { Component } from 'react'
import { clearNetwork } from '../lib/storage'
import { translate } from '../i18n'

/** Última barrera: si algo falla al renderizar, ofrece reiniciar en lugar de dejar la pantalla en blanco. */
export default class ErrorBoundary extends Component {
  state = { error: null, componentStack: '' }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Error de interfaz:', error, info.componentStack)
    this.setState({ componentStack: info.componentStack })
  }

  reset = () => {
    clearNetwork()
    location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div role="alert" className="h-full grid place-items-center p-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-lg font-semibold text-slate-100">{translate('error.title')}</h1>
          <p className="text-sm text-slate-400">{translate('error.body')}</p>
          <p className="font-mono text-xs text-red-300/80 break-words">
            {this.state.error.message}
          </p>
          {this.state.componentStack && (
            <details className="text-left text-xs text-slate-500">
              <summary className="cursor-pointer text-center">{translate('error.details')}</summary>
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap font-mono">
                {this.state.error.stack?.split('\n').slice(0, 4).join('\n')}
                {this.state.componentStack}
              </pre>
            </details>
          )}
          <div className="flex justify-center gap-2">
            <button
              onClick={() => this.setState({ error: null })}
              className="px-4 h-9 rounded-lg border border-line text-sm text-slate-200 hover:bg-white/5"
            >
              {translate('error.retry')}
            </button>
            <button
              onClick={this.reset}
              className="px-4 h-9 rounded-lg bg-water text-sm font-medium text-white"
            >
              {translate('error.reset')}
            </button>
          </div>
        </div>
      </div>
    )
  }
}
