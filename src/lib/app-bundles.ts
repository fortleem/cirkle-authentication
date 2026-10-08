// App Bundles — pre-configured groups of related Cirkle ecosystem apps.
// One-click "Authorize all" prevents the fragmentation of authorizing apps
// one by one. Each bundle surfaces the combined (strictest) requirements.

export interface AppBundle {
  id: string
  name: string
  description: string
  icon: string // lucide icon name
  color: string
  appSlugs: string[]
  combinedRequirement: string // human-readable summary of the strictest requirements
}

export const APP_BUNDLES: AppBundle[] = [
  {
    id: 'core',
    name: 'Cirkle Core',
    description: 'The foundational trio — search, super-app, and mail. Your entry point to the ecosystem.',
    icon: 'Sparkles',
    color: '#1A4A5A',
    appSlugs: ['cirkle-search', 'cirkle-superapp', 'cirkle-mail'],
    combinedRequirement: 'Email + Phone (Enhanced)',
  },
  {
    id: 'healthcare',
    name: 'Healthcare AI',
    description: 'Wedjat diagnostics + Brain AI reasoning + research study management. Strict-level healthcare suite.',
    icon: 'HeartPulse',
    color: '#dc2626',
    appSlugs: ['wedjat', 'wedjat-brainai', 'wedjatrsm'],
    combinedRequirement: 'Email + Phone + KYC + 2FA (Strict)',
  },
  {
    id: 'finance',
    name: 'Finance & Trading',
    description: 'Mithqal precious metals + MTQ Sigma quant analytics. Business + 2FA required.',
    icon: 'Coins',
    color: '#b8860b',
    appSlugs: ['mtq', 'mtq-sigma'],
    combinedRequirement: 'Email + Phone + 2FA + Business (Strict+Business)',
  },
  {
    id: 'legal',
    name: 'Legal Intelligence',
    description: 'Judge Smart case analytics + EgyCourt judicial management. 2FA mandatory.',
    icon: 'Scale',
    color: '#c9a227',
    appSlugs: ['judge-smart', 'egycourt'],
    combinedRequirement: 'Email + Phone + 2FA (Enhanced)',
  },
  {
    id: 'maritime',
    name: 'Maritime & Fleet',
    description: 'SGTX vessel tracking + SGTX Fable narrative intelligence. Business required.',
    icon: 'Ship',
    color: '#c19a2b',
    appSlugs: ['sgtx', 'sgtx-fable'],
    combinedRequirement: 'Email + Phone + 2FA + Business (Enhanced+Business)',
  },
  {
    id: 'media',
    name: 'Media & Content',
    description: 'Mashahd streaming + Aurienta AI authoring. Basic-level, easy to authorize.',
    icon: 'PlayCircle',
    color: '#cf8a1a',
    appSlugs: ['mashahd', 'aurienta'],
    combinedRequirement: 'Email (Basic)',
  },
  {
    id: 'connectivity',
    name: 'Connectivity & Comms',
    description: 'Cirkle Mail encrypted email + Wasl device presence + sync. Enhanced level.',
    icon: 'Wifi',
    color: '#daa520',
    appSlugs: ['cirkle-mail', 'wasl'],
    combinedRequirement: 'Email + Phone (Enhanced)',
  },
  {
    id: 'verify',
    name: 'Identity & Verification',
    description: 'Cirkle Verify KYC + identity validation. Strict-level security core.',
    icon: 'ShieldCheck',
    color: '#b8860b',
    appSlugs: ['verify'],
    combinedRequirement: 'Email + Phone + KYC + 2FA (Strict)',
  },
  {
    id: 'trade',
    name: 'Export & Trade',
    description: 'Olymp-Ex export trade + logistics. Business + 2FA required.',
    icon: 'Globe',
    color: '#c19a2b',
    appSlugs: ['olympex'],
    combinedRequirement: 'Email + Phone + 2FA + Business (Enhanced+Business)',
  },
]

/** Get the bundle for an app slug (which bundle contains this app?). */
export function bundleForApp(slug: string): AppBundle | undefined {
  return APP_BUNDLES.find((b) => b.appSlugs.includes(slug))
}
