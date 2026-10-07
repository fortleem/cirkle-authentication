// Post-quantum cryptography layer for Cirkle Authentication.
// ML-DSA-65 (CRYSTALS-Dilithium, FIPS 204) — NIST-standardized lattice
// signatures resistant to Shor's algorithm. Used for quantum-safe attestations
// that bind a user's identity to a post-quantum keypair.
//
// Quantum-readiness audit:
//   - Shor breaks RSA, ECDSA, ECDH, Ed25519 (used by WebAuthn passkeys).
//   - Grover halves symmetric strength (SHA-256 -> 128-bit effective, still strong).
//   - HMAC-SHA256, bcrypt, scrypt, Shamir SSS, randomBytes => already PQ-safe.
//   - WebAuthn ES256 (ECDSA P-256) => QUANTUM-VULNERABLE; mitigate via hybrid PQ.

import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js'
import { randomBytes as nobleRandomBytes } from '@noble/post-quantum/utils.js'
import { createHash, timingSafeEqual } from 'crypto'

export interface PQAttestation {
  publicKey: string // base64 ML-DSA-65 public key (1952 bytes)
  signature: string // base64 ML-DSA-65 signature (3309 bytes)
  message: string // the signed binding message (UTF-8)
  algorithm: string // 'ML-DSA-65 / FIPS-204 / NIST L3'
  securityLevel: number // 192
  createdAt: string
}

export const PQ_ALGORITHM = 'ML-DSA-65 (CRYSTALS-Dilithium, FIPS 204)'
export const PQ_SECURITY_LEVEL = ml_dsa65.securityLevel // 192 (NIST level 3)

/** Generate a fresh ML-DSA-65 keypair + sign a binding message. */
export function generatePQAttestation(userId: string, username: string, postureHash: string): PQAttestation {
  const seed = nobleRandomBytes(32)
  const keys = ml_dsa65.keygen(seed)
  const createdAt = new Date().toISOString()
  const message = `cirkle-pq-attest\nuser:${userId}\nusername:${username}\nposture:${postureHash}\nissued:${createdAt}`
  const msgBytes = new TextEncoder().encode(message)
  const signature = ml_dsa65.sign(msgBytes, keys.secretKey)
  return {
    publicKey: Buffer.from(keys.publicKey).toString('base64'),
    signature: Buffer.from(signature).toString('base64'),
    message,
    algorithm: PQ_ALGORITHM,
    securityLevel: PQ_SECURITY_LEVEL,
    createdAt,
  }
}

/** Verify a stored PQ attestation's signature against its message. */
export function verifyPQAttestation(att: {
  publicKey: string
  signature: string
  message: string
}): boolean {
  try {
    const pub = new Uint8Array(Buffer.from(att.publicKey, 'base64'))
    const sig = new Uint8Array(Buffer.from(att.signature, 'base64'))
    const msg = new TextEncoder().encode(att.message)
    return ml_dsa65.verify(sig, msg, pub)
  } catch {
    return false
  }
}

/** Constant-time comparison helper for the posture hash. */
export function safeEqualHash(a: string, b: string): boolean {
  try {
    const ab = Buffer.from(a, 'hex')
    const bb = Buffer.from(b, 'hex')
    if (ab.length !== bb.length) return false
    return timingSafeEqual(ab, bb)
  } catch {
    return false
  }
}

/** SHA-256 → hex (used for the posture hash bound into the attestation). */
export function sha256Hex(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}
