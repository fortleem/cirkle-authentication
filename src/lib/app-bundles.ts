// App Bundles — pre-configured groups of related Cirkle ecosystem apps.
// One-click "Authorize all" prevents the fragmentation of authorizing apps
// one by one. Each bundle's combined requirement is DYNAMICALLY COMPUTED
// from the actual apps' requirement profiles (not hardcoded).

import type { EcosystemApp } from '@/lib/api'

export interface AppBundle {
  id: string
  name: string
  description: string
  icon: string // lucide icon name
  color: string
  appSlugs: string[]
}

export const APP_BUNDLES: AppBundle[] = [
  {
    id: 'core',
    name: 'Cirkle Core',
    description: 'The foundational trio — search, super-app, and mail. Your entry point to the ecosystem.',
    icon: 'Sparkles',
    color: '#1A4A5A',
    appSlugs: ['cirkle-search', 'cirkle-superapp', 'cirkle-mail'],
  },
  {
    id: 'healthcare',
    name: 'Healthcare AI',
    description: 'Wedjat diagnostics + Brain AI reasoning + research study management. Strict-level healthcare suite.',
    icon: 'HeartPulse',
    color: '#dc2626',
    appSlugs: ['wedjat', 'wedjat-brainai', 'wedjatrsm'],
  },
  {
    id: 'finance',
    name: 'Finance & Trading',
    description: 'Mithqal precious metals + MTQ Sigma quant analytics. Business + 2FA required.',
    icon: 'Coins',
    color: '#b8860b',
    appSlugs: ['mtq', 'mtq-sigma'],
  },
  {
    id: 'legal',
    name: 'Legal Intelligence',
    description: 'Judge Smart case analytics + EgyCourt judicial management. 2FA mandatory.',
    icon: 'Scale',
    color: '#c9a227',
    appSlugs: ['judge-smart', 'egycourt'],
  },
  {
    id: 'maritime',
    name: 'Maritime & Fleet',
    description: 'SGTX vessel tracking + SGTX Fable narrative intelligence. Business required.',
    icon: 'Ship',
    color: '#c19a2b',
    appSlugs: ['sgtx', 'sgtx-fable'],
  },
  {
    id: 'media',
    name: 'Media & Content',
    description: 'Mashahd streaming + Aurienta AI authoring. Basic-level, easy to authorize.',
    icon: 'PlayCircle',
    color: '#cf8a1a',
    appSlugs: ['mashahd', 'aurienta'],
  },
  {
    id: 'connectivity',
    name: 'Connectivity & Comms',
    description: 'Cirkle Mail encrypted email + Wasl device presence + sync. Enhanced level.',
    icon: 'Wifi',
    color: '#daa520',
    appSlugs: ['cirkle-mail', 'wasl'],
  },
  {
    id: 'verify',
    name: 'Identity & Verification',
    description: 'Cirkle Verify KYC + identity validation. Strict-level security core.',
    icon: 'ShieldCheck',
    color: '#b8860b',
    appSlugs: ['verify'],
  },
  {
    id: 'trade',
    name: 'Export & Trade',
    description: 'Olymp-Ex export trade + logistics. Business + 2FA required.',
    icon: 'Globe',
    color: '#c19a2b',
    appSlugs: ['olympex'],
  },
]

/**
 * DYNAMICALLY COMPUTE the combined (strictest) requirement for a set of apps.
 * Each app carries its own requirement profile (identityType, verificationLevel,
 * twoFactorRequired, businessRequired). The bundle picks the strictest combination:
 *
 * - verificationLevel: the MAX across all apps (basic < enhanced < strict)
 * - twoFactorRequired: true if ANY app requires it
 * - businessRequired: true if ANY app requires it OR any app's identityType is 'business'
 * - identityType: 'business' if any app is business-only, else 'either' if any is either, else 'personal'
 *
 * Returns a human-readable string + a structured breakdown.
 */
export interface CombinedRequirement {
  label: string // human-readable summary
  verificationLevel: 'basic' | 'enhanced' | 'strict'
  twoFactorRequired: boolean
  businessRequired: boolean
  identityType: 'personal' | 'business' | 'either'
  parts: string[] // individual requirement parts (for badges)
}

export function computeCombinedRequirement(apps: EcosystemApp[]): CombinedRequirement {
  if (apps.length === 0) {
    return {
      label: 'No apps',
      verificationLevel: 'basic',
      twoFactorRequired: false,
      businessRequired: false,
      identityType: 'either',
      parts: [],
    }
  }

  // Pick the strictest verification level (basic < enhanced < strict)
  const levelRank = { basic: 0, enhanced: 1, strict: 2 }
  let strictestLevel: 'basic' | 'enhanced' | 'strict' = 'basic'
  let twoFactorRequired = false
  let businessRequired = false
  let identityType: 'personal' | 'business' | 'either' = 'personal'

  for (const app of apps) {
    const lvl = app.requirements.verificationLevel
    if (levelRank[lvl] > levelRank[strictestLevel]) {
      strictestLevel = lvl
    }
    if (app.requirements.twoFactorRequired) twoFactorRequired = true
    if (app.requirements.businessRequired) businessRequired = true
    if (app.requirements.identityType === 'business') {
      identityType = 'business'
      businessRequired = true
    } else if (app.requirements.identityType === 'either' && identityType !== 'business') {
      identityType = 'either'
    }
  }

  // Build the human-readable parts
  const parts: string[] = ['Email']
  if (strictestLevel === 'enhanced' || strictestLevel === 'strict') parts.push('Phone')
  if (strictestLevel === 'strict') parts.push('KYC')
  if (twoFactorRequired) parts.push('2FA')
  if (businessRequired) parts.push('Business')

  const levelLabel = strictestLevel.charAt(0).toUpperCase() + strictestLevel.slice(1)
  const extraLabels: string[] = []
  if (twoFactorRequired) extraLabels.push('2FA')
  if (businessRequired) extraLabels.push('Business')
  const extra = extraLabels.length ? ` +${extraLabels.join('+')}` : ''
  const label = `${parts.join(' + ')} (${levelLabel}${extra})`

  return {
    label,
    verificationLevel: strictestLevel,
    twoFactorRequired,
    businessRequired,
    identityType,
    parts,
  }
}

/** Get the bundle for an app slug (which bundle contains this app?). */
export function bundleForApp(slug: string): AppBundle | undefined {
  return APP_BUNDLES.find((b) => b.appSlugs.includes(slug))
}
