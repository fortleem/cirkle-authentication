// Social Recovery — real Shamir's Secret Sharing over GF(256).
// A recovery secret is split into N shares; any M shares reconstruct it.
// The reconstructed secret authorizes account recovery. No competitor
// ships cryptographic social recovery in an identity product.

import { createHash, randomBytes, timingSafeEqual } from 'crypto'
import { split as sssSplit, combine as sssCombine } from 'shamirs-secret-sharing'

export interface SplitResult {
  shares: string[] // base64 shares to distribute to guardians
  threshold: number
  total: number
  secretHash: string // SHA-256 of the secret (for verification), NOT the secret
}

/** Generate a random 256-bit recovery secret + split it into N shares (threshold M). */
export function createRecoverySecret(threshold: number, total: number): { secret: string; split: SplitResult } {
  const secret = randomBytes(32) // 256-bit master secret
  const secretStr = secret.toString('hex')
  const shares = sssSplit(secret, { shares: total, threshold })
  const shareStrings = shares.map((b: Buffer) => b.toString('base64'))
  return {
    secret: secretStr,
    split: {
      shares: shareStrings,
      threshold,
      total,
      secretHash: createHash('sha256').update(secret).digest('hex'),
    },
  }
}

/** Reconstruct the secret from M shares (base64). Returns the hex secret or null. */
export function reconstructSecret(shareStrings: string[]): string | null {
  try {
    const shares = shareStrings.map((s) => Buffer.from(s, 'base64'))
    const combined = sssCombine(shares)
    if (!combined || combined.length === 0) return null
    return combined.toString('hex')
  } catch {
    return null
  }
}

/** Verify a reconstructed secret against the stored hash (constant-time). */
export function verifySecret(reconstructedHex: string, storedHash: string): boolean {
  try {
    const hash = createHash('sha256').update(Buffer.from(reconstructedHex, 'hex')).digest()
    const stored = Buffer.from(storedHash, 'hex')
    if (hash.length !== stored.length) return false
    return timingSafeEqual(hash, stored)
  } catch {
    return false
  }
}

/** Distribute N shares among N guardians — each guardian gets exactly one share (returned once). */
export function distributeShares(guardianIds: string[], shares: string[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (let i = 0; i < guardianIds.length && i < shares.length; i++) {
    map[guardianIds[i]] = shares[i]
  }
  return map
}
