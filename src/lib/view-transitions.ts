'use client'

/**
 * View Transitions API — smooth cross-fade on dashboard tab switches.
 * Uses the native document.startViewTransition() when supported (Chrome 111+),
 * falls back to the existing framer-motion transitions otherwise.
 */
export function startViewTransition(callback: () => void) {
  if (typeof document !== 'undefined' && 'startViewTransition' in document) {
    ;(document as Document & { startViewTransition: (cb: () => void) => void }).startViewTransition(callback)
  } else {
    callback()
  }
}

/** Check if the browser supports the View Transitions API. */
export function supportsViewTransitions(): boolean {
  return typeof document !== 'undefined' && 'startViewTransition' in document
}
