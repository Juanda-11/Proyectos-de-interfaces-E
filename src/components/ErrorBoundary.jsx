import { Component } from 'react'
import { clearNetwork } from '../lib/storage'

/** Última barrera: si algo falla al renderizar, ofrece reiniciar en lugar de dejar la pantalla en blanco. */
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Error de interfaz:', error, info.componentStack)
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
          <h1 className="text-lg font-semibold text-slate-100">Algo salió mal</h1>
          <p className="text-sm text-slate-400">La aplicación encontró un error inesperado. Puedes reintentar o, si persiste, reiniciar con la red de ejemplo (se borrará la copia guardada).</p>
          <p className="font-mono text-xs text-red-300/80 break-words">{this.state.error.message}</p>
          <div className="flex justify-center gap-2">
            <button onClick={() => this.setState({ error: null })} className="px-4 h-9 rounded-lg border border-line text-sm text-slate-200 hover:bg-white/5">Reintentar</button>
            <button onClick={this.reset} className="px-4 h-9 rounded-lg bg-water text-sm font-medium text-white">Reiniciar</button>
          </div>
        </div>
      </div>
    )
  }
}
