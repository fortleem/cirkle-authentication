'use client'

import { useEffect } from 'react'

/**
 * Speculation Rules API — the latest 2026 navigation technology.
 * Prefetches routes/documents so page transitions feel INSTANT.
 * Chrome 121+ | Falls back gracefully (no-op in unsupported browsers).
 *
 * Two modes:
 * 1. 'prefetch' — fetches the document in the background (low priority)
 * 2. 'prerender' — actually renders the page in a hidden tab (instant on click)
 */
export function SpeculationRules() {
  useEffect(() => {
    if (typeof document === 'undefined') return

    // Check if the browser supports the Speculation Rules API
    const supportsSpeculationRules = HTMLScriptElement.supports?.('speculationrules')

    if (supportsSpeculationRules) {
      // Create the speculation rules script
      const script = document.createElement('script')
      script.type = 'speculationrules'
      script.textContent = JSON.stringify({
        prefetch: [
          {
            source: 'document',
            where: { href_matches: '/*' },
            eagerness: 'moderate', // prefetch on hover/viewport
          },
        ],
        prerender: [
          {
            source: 'document',
            where: {
              and: [
                { href_matches: '/*' },
                { not: { selector_matches: '.no-prerender' } },
              ],
            },
            eagerness: 'eager', // prerender immediately for same-origin links
          },
        ],
      })
      document.head.appendChild(script)
    }
  }, [])

  return null
}
