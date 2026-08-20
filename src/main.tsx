import React from 'react'
import ReactDOM from 'react-dom/client'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import { isStaleModuleError, reloadForStaleModule } from '@/lib/lazy'
import '@fontsource/outfit/300.css'
import '@fontsource/outfit/400.css'
import '@fontsource/outfit/500.css'
import '@fontsource/outfit/600.css'
import '@fontsource/outfit/700.css'
import '@fontsource/outfit/800.css'
import '@fontsource/fredoka/700.css'
import './styles/globals.css'

const rootEl = document.getElementById('root')!

function renderConfigError(message: string) {
  ReactDOM.createRoot(rootEl).render(
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', backgroundColor: '#0A0A0A', color: '#FFFFFF', fontFamily: 'Outfit, sans-serif',
      padding: '2rem', textAlign: 'center',
    }}>
      <div style={{ maxWidth: '500px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Configuration Error</h1>
        <p style={{ color: '#A1A1AA', fontSize: '0.9rem', marginTop: '0.75rem' }}>{message}</p>
      </div>
    </div>
  )
}

// When the Vite dev server restarts (config/dependency changes), the browser's
// module graph and pre-bundled deps go stale. Symptoms include failed dynamic
// imports AND optimized deps resolving to `null` (e.g. React, surfacing as
// "Cannot read properties of null (reading 'useContext')"). Reload once to pull
// a fresh graph instead of crashing into the error boundary.
const STALE_MODULE_PATTERNS = [
  /Failed to fetch dynamically imported module/,
  /Cannot read properties of null \(reading 'useContext'\)/,
  /Failed to resolve module specifier/,
  /Importing a module script failed/,
  /Out of stack space/,
]

function onStaleModuleError(message: unknown) {
  const msg = typeof message === 'string' ? message : String(message ?? '')
  if (STALE_MODULE_PATTERNS.some((pattern) => pattern.test(msg))) {
    reloadForStaleModule()
  }
}

window.addEventListener('vite:preloadError', reloadForStaleModule)
window.addEventListener('error', (event) => onStaleModuleError(event.message))
window.addEventListener('unhandledrejection', (event) => {
  const reason = (event as PromiseRejectionEvent).reason
  onStaleModuleError(reason?.message ?? reason)
})

async function loadApp() {
  try {
    return (await import('./App.tsx')).default
  } catch (error) {
    if (isStaleModuleError(error)) reloadForStaleModule()
    throw error
  }
}

async function bootstrap() {
  try {
    const App = await loadApp()
    ReactDOM.createRoot(rootEl).render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>,
    )
  } catch (err: any) {
    renderConfigError(err?.message || 'Failed to initialize the application.')
  }
}

bootstrap().catch((err: any) => {
  renderConfigError(err?.message || 'Failed to start the application.')
})
