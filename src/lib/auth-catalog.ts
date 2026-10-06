// Auth Atlas — the organized catalog of every authentication method in the
// Cirkle ecosystem + a helper to derive which methods each platform needs.

import {
  Lock,
  AtSign,
  Fingerprint,
  ShieldCheck,
  KeyRound,
  IdCard,
  Phone,
  Building2,
  Cookie,
  FileCheck2,
  ScanFace,
  type LucideIcon,
} from 'lucide-react'

export type AuthCategory = 'identity' | 'factor' | 'verification' | 'authorization'
export type UXLevel = 'easy' | 'moderate' | 'friction'

export interface AuthMethod {
  id: string
  name: string
  category: AuthCategory
  icon: LucideIcon
  summary: string
  securityStrength: number // 1–5 shields
  phishingResistant: boolean
  ux: UXLevel
  description: string
  usedFor: string[]
}

export const AUTH_METHODS: AuthMethod[] = [
  {
    id: 'username',
    name: 'Username (@handle)',
    category: 'identity',
    icon: AtSign,
    summary: 'The single ecosystem handle — one username reaches every Cirkle app.',
    securityStrength: 1,
    phishingResistant: false,
    ux: 'easy',
    description: 'Your unique @handle across the whole ecosystem. Login accepts it or your email interchangeably. Personal + business profiles attach to it.',
    usedFor: ['identification', 'sign-in handle', 'ecosystem-wide reach'],
  },
  {
    id: 'password',
    name: 'Password',
    category: 'identity',
    icon: Lock,
    summary: 'A secret known only to you, bcrypt-hashed (salt 12).',
    securityStrength: 2,
    phishingResistant: false,
    ux: 'moderate',
    description: 'The baseline sign-in secret. Hashed with bcrypt, never stored in plaintext, never shared with apps. Minimum 8 chars; strength meter guides you.',
    usedFor: ['baseline sign-in', 'fallback when no passkey'],
  },
  {
    id: 'passkey',
    name: 'Passkey (WebAuthn)',
    category: 'factor',
    icon: Fingerprint,
    summary: 'Phishing-resistant passwordless sign-in via fingerprint / face / device screen lock.',
    securityStrength: 5,
    phishingResistant: true,
    ux: 'easy',
    description: 'The modern standard. A credential bound to your device + biometric/screen-lock. No password, no phishable secret. Stateless HMAC-signed challenges.',
    usedFor: ['passwordless sign-in', 'modern primary CTA', 'touch ID / face ID'],
  },
  {
    id: 'totp-2fa',
    name: 'TOTP 2FA',
    category: 'factor',
    icon: ShieldCheck,
    summary: 'A one-time code from an authenticator app at every sign-in.',
    securityStrength: 4,
    phishingResistant: false,
    ux: 'moderate',
    description: 'A time-based one-time password from an authenticator app. Adds a second factor beyond the password. Mandatory for finance, legal, healthcare apps.',
    usedFor: ['finance', 'legal', 'healthcare', 'step-up', 'high-risk apps'],
  },
  {
    id: 'recovery-codes',
    name: 'Recovery codes',
    category: 'factor',
    icon: KeyRound,
    summary: '10 one-time backup codes — the 2FA fallback if you lose your device.',
    securityStrength: 4,
    phishingResistant: false,
    ux: 'moderate',
    description: 'One-time codes (XXXX-XXXX-XXXX, scrypt-hashed) generated when 2FA is on. Each works once. Use them to sign in if your authenticator device is lost.',
    usedFor: ['2FA fallback', 'account recovery', 'lost-device'],
  },
  {
    id: 'phone',
    name: 'Phone verification',
    category: 'verification',
    icon: Phone,
    summary: 'A verified phone number — recovery channel + enhanced identity proof.',
    securityStrength: 3,
    phishingResistant: false,
    ux: 'moderate',
    description: 'A verified phone adds a recovery channel and lifts you to the Enhanced tier, unlocking more apps. Verified via an OTP/preview flow.',
    usedFor: ['Enhanced-tier apps', 'recovery channel', 'Wasl, Cirkle Mail, MTQ'],
  },
  {
    id: 'kyc',
    name: 'KYC (government ID)',
    category: 'verification',
    icon: IdCard,
    summary: 'Government ID + selfie verification via Cirkle Verify.',
    securityStrength: 5,
    phishingResistant: true,
    ux: 'friction',
    description: 'Identity verification: government ID + selfie. Lifts you to the Strict tier, unlocking healthcare, finance-KYC, and the Cirkle Verify core itself.',
    usedFor: ['Strict-tier apps', 'healthcare (Wedjat)', 'Verify core', 'MTQ Sigma'],
  },
  {
    id: 'business',
    name: 'Business verification',
    category: 'verification',
    icon: Building2,
    summary: 'A verified business profile (legal name, tax ID, type).',
    securityStrength: 4,
    phishingResistant: true,
    ux: 'friction',
    description: 'A linked + verified business profile attached to your single @username. Required for SGTX, PPE Smart, MTQ Sigma, and Olymp-Ex. Personal + business share one identity.',
    usedFor: ['business-required apps', 'SGTX', 'PPE', 'Olymp-Ex', 'MTQ Sigma'],
  },
  {
    id: 'session-cookie',
    name: 'Session cookie',
    category: 'authorization',
    icon: Cookie,
    summary: 'A signed JWT in an httpOnly, sameSite, 30-day cookie.',
    securityStrength: 3,
    phishingResistant: true,
    ux: 'easy',
    description: 'The signed-in state: a JWT (with a unique jti) stored in an httpOnly + sameSite=lax cookie. Validated against the DB session table. Revocable per-device.',
    usedFor: ['persistent sign-in', '30-day session', 'per-device revocation'],
  },
  {
    id: 'oauth-scopes',
    name: 'OAuth scopes',
    category: 'authorization',
    icon: KeyRound,
    summary: 'Per-app scoped access tokens — apps never see your password.',
    securityStrength: 4,
    phishingResistant: true,
    ux: 'easy',
    description: 'Each app receives only the scopes it was granted (openid, profile, email, search.read, health.read, …). Apps never see your password, 2FA secret, or session tokens.',
    usedFor: ['per-app authorization', 'scoped data access', 'least-privilege'],
  },
  {
    id: 'consent',
    name: 'SSO consent flow',
    category: 'authorization',
    icon: ScanFace,
    summary: 'Explicit per-app authorization with a scoped consent screen + dynamic requirement checks.',
    securityStrength: 4,
    phishingResistant: true,
    ux: 'easy',
    description: 'Every app connection goes through a consent modal: shows the app, requested scopes, and a live requirement checklist. Authorize is disabled until requirements are met. Revocable anytime.',
    usedFor: ['every app connection', 'dynamic requirements', 'revocable access'],
  },
]

export interface AppRequirementsInput {
  identityType: 'personal' | 'business' | 'either'
  verificationLevel: 'basic' | 'enhanced' | 'strict'
  twoFactorRequired: boolean
  businessRequired: boolean
  requiredScopes: string
}

/**
 * Derive the ordered list of auth methods a platform needs from its requirement
 * profile. Always includes the baseline (username, password/passkey, session,
 * scopes, consent); then adds verification + factor methods per the level.
 */
export function methodsForApp(req: AppRequirementsInput): string[] {
  const ids: string[] = ['username', 'password', 'passkey', 'session-cookie', 'oauth-scopes', 'consent']
  // Verification ladder (cumulative)
  if (req.verificationLevel === 'basic') ids.push('password') // email implied by identity
  if (req.verificationLevel === 'enhanced' || req.verificationLevel === 'strict') {
    ids.push('phone')
  }
  if (req.verificationLevel === 'strict') {
    ids.push('kyc')
  }
  if (req.twoFactorRequired) {
    ids.push('totp-2fa', 'recovery-codes')
  }
  if (req.businessRequired || req.identityType === 'business') {
    ids.push('business')
  }
  // dedupe preserving order
  return Array.from(new Set(ids))
}

export function categoryLabel(c: AuthCategory): string {
  return c === 'identity' ? 'Identity' : c === 'factor' ? 'Factor' : c === 'verification' ? 'Verification' : 'Authorization'
}

export function categoryColor(c: AuthCategory): string {
  return c === 'identity'
    ? 'border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-400'
    : c === 'factor'
      ? 'border-primary/30 bg-primary/5 text-primary'
      : c === 'verification'
        ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
        : 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400'
}

export const VERIFICATION_TIERS = [
  {
    name: 'Basic',
    color: 'hsl(var(--teal))',
    includes: ['Email verified'],
    unlocks: ['Cirkle-Search', 'Cirkle SuperApp', 'Mashahd', 'Aurienta', 'SGTX Fable'],
  },
  {
    name: 'Enhanced',
    color: 'hsl(var(--gold))',
    includes: ['Email + Phone verified'],
    unlocks: ['+ Cirkle Mail', 'Wasl', 'MTQ', 'Judge Smart', 'EgyCourt'],
  },
  {
    name: 'Strict',
    color: 'hsl(var(--rose))',
    includes: ['Email + Phone + KYC + 2FA'],
    unlocks: ['+ Wedjat', 'Wedjat Brain AI', 'WedjatRSM', 'Cirkle Verify', 'MTQ Sigma'],
  },
  {
    name: 'Business',
    color: 'hsl(var(--steel))',
    includes: ['A verified business profile'],
    unlocks: ['+ SGTX', 'PPE Smart', 'Olymp-Ex'],
  },
]
