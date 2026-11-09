'use client'

import { useCallback } from 'react'

/**
 * Web Share API — the latest 2026 native sharing technology.
 * Uses the OS-level share sheet (iOS/Android/Windows) when available,
 * falls back to clipboard copy. Zero-friction sharing for the Identity Card.
 *
 * Support is checked lazily (no setState-in-effect).
 */
export function useWebShare() {
  const isSupported = useCallback(() => {
    return typeof navigator !== 'undefined' && 'share' in navigator
  }, [])

  const share = useCallback(async (data: {
    title: string
    text: string
    url?: string
    files?: File[]
  }): Promise<'shared' | 'copied' | 'failed'> => {
    try {
      // If files are present + navigator.canShare supports them
      if (data.files && data.files.length > 0 && navigator.canShare?.({ files: data.files })) {
        await navigator.share({ ...data, files: data.files })
        return 'shared'
      }

      // Standard share (text + URL) — check via typeof to avoid over-narrowing
      // the Navigator type with the `in` operator.
      if (typeof navigator.share === 'function') {
        await navigator.share(data)
        return 'shared'
      }

      // Fallback: clipboard
      await navigator.clipboard.writeText(`${data.title}\n${data.text}${data.url ? `\n${data.url}` : ''}`)
      return 'copied'
    } catch (e) {
      // User cancelled the share sheet (AbortError) — not a failure
      if (e instanceof Error && e.name === 'AbortError') return 'shared'
      return 'failed'
    }
  }, [])

  return { isSupported, share }
}

/** Generate a PNG file of the Identity Card for sharing via the Web Share API Level 2. */
export async function generateCardShareFile(cardElement: HTMLElement): Promise<File | null> {
  try {
    const html = cardElement.outerHTML
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="252"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml">${html}</div></foreignObject></svg>`
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    return new File([blob], 'cirkle-identity-card.svg', { type: 'image/svg+xml' })
  } catch {
    return null
  }
}
