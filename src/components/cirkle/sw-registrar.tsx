'use client'

import { useEffect } from 'react'

/** Registers the Cirkle PWA service worker for offline app-shell caching. */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
    // Also register in dev for testing (the SW handles stale-while-revalidate)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])
  return null
}
