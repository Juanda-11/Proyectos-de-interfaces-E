import { createRoot } from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastProvider } from './hooks/useToasts'
import { I18nProvider } from './i18n/I18nProvider'
import './index.css'

createRoot(document.getElementById('root')).render(
  <I18nProvider>
    <ErrorBoundary>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ErrorBoundary>
  </I18nProvider>,
)
