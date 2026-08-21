import { lazy, type ComponentType } from 'react'

type ImportFactory<T extends ComponentType> = () => Promise<{ default: T }>

const RELOAD_FLAG = 'vite-dynamic-import-reload'
const RELOAD_COOLDOWN_MS = 10_000

export function isStaleModuleError(error: unknown): boolean {
  return (
    error instanceof TypeError &&
    /Failed to fetch dynamically imported module/.test(error.message)
  )
}

// Vite dev-server restarts invalidate already-resolved module URLs, so retrying
// the same import() returns the same stale URL. Reload the page instead (once per
// cooldown window, so a genuinely broken module can't cause a reload loop) to pull
// a fresh module graph.
export function reloadForStaleModule(): void {
  const last = Number(sessionStorage.getItem(RELOAD_FLAG) || 0)
  if (Date.now() - last > RELOAD_COOLDOWN_MS) {
    sessionStorage.setItem(RELOAD_FLAG, String(Date.now()))
    window.location.reload()
  }
}

export function lazyWithRetry<T extends ComponentType>(factory: ImportFactory<T>, retries = 1) {
  return lazy<T>(async () => {
    try {
      return await factory()
    } catch (error) {
      if (isStaleModuleError(error)) {
        reloadForStaleModule()
        throw error
      }
      // Transient failure (e.g. brief network drop) — retry the import a few times.
      await new Promise(resolve => setTimeout(resolve, 500))
      for (let attempt = 0; attempt < retries; attempt += 1) {
        try {
          return await factory()
        } catch {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
      throw error
    }
  })
}
