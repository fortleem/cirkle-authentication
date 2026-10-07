// Quantum Readiness audit — classifies every cryptographic primitive + auth
// method in Cirkle Authentication as quantum-safe (Q-SAFE), quantum-vulnerable
// (Q-VULN), or hybrid (HYBRID). Computes a posture score + migration roadmap.

export type QuantumStatus = 'safe' | 'vulnerable' | 'hybrid'

export interface CryptoPrimitive {
  id: string
  name: string
  usedIn: string // where Cirkle uses it
  status: QuantumStatus
  threat: string // "Shor" or "Grover" or "none"
  detail: string
  mitigation: string
}

// The actual primitives Cirkle uses today.
export const CRYPTO_PRIMITIVES: CryptoPrimitive[] = [
  {
    id: 'hmac-sha256',
    name: 'HMAC-SHA256',
    usedIn: 'JWT session tokens, passkey/risk challenge signing',
    status: 'safe',
    threat: 'Grover (halves to 128-bit effective — still strong)',
    detail: 'Symmetric MAC. Quantum attacks only halve the security; 256-bit HMAC retains ~128-bit post-quantum strength.',
    mitigation: 'No action required. Optionally upgrade to HMAC-SHA3-256 for defense-in-depth.',
  },
  {
    id: 'bcrypt',
    name: 'bcrypt (password hashing)',
    usedIn: 'User password verification',
    status: 'safe',
    threat: 'Grover (negligible — bcrypt is cost-factor bound)',
    detail: 'Symmetric, memory-light. Grover provides quadratic speedup but bcrypt\'s 12-round cost factor dominates; remains PQ-safe.',
    mitigation: 'No action required. Consider argon2id for memory-hardness if desired.',
  },
  {
    id: 'scrypt',
    name: 'scrypt (recovery-code hashing)',
    usedIn: 'One-time recovery-code verification',
    status: 'safe',
    threat: 'Grover (negligible — memory-hard)',
    detail: 'Memory-hard KDF. Quantum speedup is irrelevant against the memory-cost asymmetry.',
    mitigation: 'No action required.',
  },
  {
    id: 'shamir-sss',
    name: "Shamir's Secret Sharing (GF(256))",
    usedIn: 'M-of-N social recovery',
    status: 'safe',
    threat: 'none (information-theoretic)',
    detail: 'SSS is information-theoretically secure — unbreakable even by a quantum computer below the threshold.',
    mitigation: 'No action required. Already quantum-proof by construction.',
  },
  {
    id: 'randombytes',
    name: 'CSPRNG (randomBytes)',
    usedIn: 'Session token jti, recovery secret, challenge nonce',
    status: 'safe',
    threat: 'none',
    detail: 'Cryptographically-secure randomness is quantum-resistant by definition.',
    mitigation: 'No action required.',
  },
  {
    id: 'sha-256',
    name: 'SHA-256',
    usedIn: 'Recovery-secret hash, audit integrity',
    status: 'safe',
    threat: 'Grover (128-bit effective collision resistance)',
    detail: 'Grover halves preimage resistance to 128-bit; collision resistance drops to 128-bit. Still considered PQ-safe.',
    mitigation: 'Optional: migrate to SHA-3 / SHAKE-256 for 256-bit PQ collision resistance.',
  },
  {
    id: 'webauthn-es256',
    name: 'WebAuthn ES256 (ECDSA P-256)',
    usedIn: 'Passkey registration + login',
    status: 'vulnerable',
    threat: "Shor (breaks ECDSA — recovers the private key from the public key)",
    detail: 'The passkey credential uses ECDSA P-256, which Shor\'s algorithm breaks. This is Cirkle\'s primary quantum exposure.',
    mitigation: 'Migrate to hybrid PQ WebAuthn (ML-DSA + ES256) when browsers ship WebAuthn L3 hybrid support (~2025-2026). Until then, the ML-DSA attestation layer (this upgrade) provides a parallel PQ signature.',
  },
  {
    id: 'ml-dsa-65',
    name: 'ML-DSA-65 (CRYSTALS-Dilithium, FIPS 204)',
    usedIn: 'Post-quantum identity attestation (NEW)',
    status: 'safe',
    threat: 'none (lattice-based, NIST-standardized)',
    detail: 'NIST FIPS 204, security level 3 (192-bit). Resistant to both Shor and Grover. Binds each identity to a PQ keypair.',
    mitigation: 'Already PQ-safe. This is the upgrade.',
  },
]

export interface PostureScore {
  score: number // 0-100 quantum-readiness
  level: string // e.g. 'Quantum-Resistant', 'Transitional', 'At Risk'
  safeCount: number
  vulnerableCount: number
  hybridCount: number
  total: number
}

export function computePostureScore(primitives: CryptoPrimitive[]): PostureScore {
  const safe = primitives.filter((p) => p.status === 'safe').length
  const vuln = primitives.filter((p) => p.status === 'vulnerable').length
  const hybrid = primitives.filter((p) => p.status === 'hybrid').length
  const total = primitives.length
  // Each primitive weighted equally; vulnerable ones count 0, hybrid 0.5, safe 1.
  const raw = primitives.reduce((a, p) => a + (p.status === 'safe' ? 1 : p.status === 'hybrid' ? 0.5 : 0), 0)
  const score = Math.round((raw / total) * 100)
  const level = score >= 90 ? 'Quantum-Resistant' : score >= 60 ? 'Transitional' : score >= 30 ? 'At Risk' : 'Critical'
  return { score, level, safeCount: safe, vulnerableCount: vuln, hybridCount: hybrid, total }
}

/** The auth-method quantum classification (for the Auth Atlas badges). */
export const METHOD_QUANTUM_STATUS: Record<string, QuantumStatus> = {
  username: 'safe', // not cryptographic
  password: 'safe', // bcrypt (symmetric)
  passkey: 'hybrid', // ECDSA (vuln) + ML-DSA attestation (safe) = hybrid transitional
  'totp-2fa': 'safe', // symmetric HMAC-based
  'recovery-codes': 'safe', // scrypt
  phone: 'safe', // not cryptographic
  kyc: 'safe', // identity-bound, not crypto
  business: 'safe',
  'session-cookie': 'safe', // HMAC-SHA256
  'oauth-scopes': 'safe', // symmetric tokens
  consent: 'safe',
}

export function statusLabel(s: QuantumStatus): string {
  return s === 'safe' ? 'Q-SAFE' : s === 'vulnerable' ? 'Q-VULN' : 'HYBRID'
}

export function statusColor(s: QuantumStatus): string {
  return s === 'safe'
    ? 'border-primary/30 bg-primary/5 text-primary'
    : s === 'vulnerable'
      ? 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400'
      : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
}
