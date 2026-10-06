// Privacy Simulator — maps OAuth-style scopes to concrete data fields a viewer
// can see, computes a 0-100 visibility score, and recommends revocations.

export interface DataField {
  key: string
  label: string
  sensitivity: number // 1-10 weight
  grantedBy: string[] // scopes that expose this field
}

export const ALL_DATA_FIELDS: DataField[] = [
  { key: 'identity', label: 'Cirkle identity exists', sensitivity: 1, grantedBy: ['openid'] },
  { key: 'name', label: 'Display name', sensitivity: 2, grantedBy: ['profile'] },
  { key: 'username', label: 'Username (@handle)', sensitivity: 2, grantedBy: ['profile'] },
  { key: 'avatar', label: 'Avatar / identity DNA', sensitivity: 2, grantedBy: ['profile'] },
  { key: 'email', label: 'Email address', sensitivity: 4, grantedBy: ['email'] },
  { key: 'phone', label: 'Phone number', sensitivity: 5, grantedBy: ['phone.read'] },
  { key: 'business', label: 'Business profile + context', sensitivity: 5, grantedBy: ['business.read'] },
  { key: 'sessions', label: 'Active sessions', sensitivity: 6, grantedBy: ['sessions.read'] },
  { key: 'search', label: 'Search history / queries', sensitivity: 6, grantedBy: ['search.read'] },
  { key: 'health', label: 'Health data (Wedjat)', sensitivity: 9, grantedBy: ['health.read'] },
  { key: 'medical', label: 'Medical reasoning + diagnoses', sensitivity: 9, grantedBy: ['medical.reasoning'] },
  { key: 'trades', label: 'Financial trades + portfolio', sensitivity: 8, grantedBy: ['trades.read'] },
  { key: 'legal', label: 'Legal cases + analytics', sensitivity: 8, grantedBy: ['cases.read', 'legal.read', 'court.read'] },
  { key: 'fleet', label: 'Maritime fleet + AIS data', sensitivity: 7, grantedBy: ['fleet.read', 'ais.read'] },
  { key: 'safety', label: 'Workplace safety compliance', sensitivity: 7, grantedBy: ['safety.read', 'compliance.read'] },
  { key: 'content', label: 'Authored content (Aurienta)', sensitivity: 6, grantedBy: ['content.write'] },
  { key: 'devices', label: 'Connected devices (Wasl)', sensitivity: 6, grantedBy: ['devices.read', 'devices.pair'] },
  { key: 'verify', label: 'KYC / government ID', sensitivity: 9, grantedBy: ['verify.kyc', 'verify.documents'] },
  { key: 'analytics', label: 'Quant analytics + risk', sensitivity: 8, grantedBy: ['analytics.read', 'quant.read'] },
  { key: 'media', label: 'Media playback + history', sensitivity: 5, grantedBy: ['media.read', 'media.play'] },
  { key: 'research', label: 'Clinical research data', sensitivity: 9, grantedBy: ['research.read', 'clinical.read'] },
  { key: 'trade', label: 'Export trade + customs docs', sensitivity: 7, grantedBy: ['trade.documents', 'customs.read'] },
]

export interface ViewerVisibility {
  visibleFields: DataField[]
  hiddenFields: DataField[]
  score: number // 0-100
  scopeList: string[]
}

/** Compute which fields a viewer can see given their granted scopes. */
export function computeVisibility(grantedScopes: string[]): ViewerVisibility {
  const scopeSet = new Set(grantedScopes.map((s) => s.trim()))
  const visibleFields: DataField[] = []
  const hiddenFields: DataField[] = []
  for (const field of ALL_DATA_FIELDS) {
    const seen = field.grantedBy.some((s) => scopeSet.has(s))
    if (seen) visibleFields.push(field)
    else hiddenFields.push(field)
  }
  const totalSensitivity = ALL_DATA_FIELDS.reduce((a, f) => a + f.sensitivity, 0)
  const visibleSensitivity = visibleFields.reduce((a, f) => a + f.sensitivity, 0)
  const score = totalSensitivity > 0 ? Math.round((visibleSensitivity / totalSensitivity) * 100) : 0
  return { visibleFields, hiddenFields, score, scopeList: grantedScopes }
}

/** What "the public" (no scopes) can see about a user. */
export const PUBLIC_VISIBILITY: DataField[] = [
  { key: 'identity', label: 'Your Cirkle identity exists', sensitivity: 1, grantedBy: ['openid'] },
  { key: 'username', label: 'Public @username', sensitivity: 2, grantedBy: ['profile'] },
]

export function visibilityGrade(score: number): { label: string; color: string } {
  if (score >= 70) return { label: 'High exposure', color: 'hsl(var(--rose))' }
  if (score >= 40) return { label: 'Moderate', color: 'hsl(var(--gold))' }
  if (score >= 15) return { label: 'Low', color: 'hsl(var(--teal))' }
  return { label: 'Minimal', color: 'hsl(var(--teal))' }
}

/** Recommendation: which fields a user could hide by revoking an app. */
export function recommendationsFor(visibleFields: DataField[], appName: string): string[] {
  const sensitive = visibleFields.filter((f) => f.sensitivity >= 7).map((f) => f.label)
  const recs: string[] = []
  if (sensitive.length) {
    recs.push(`Revoke ${appName} to hide ${sensitive.slice(0, 3).join(', ')}${sensitive.length > 3 ? '…' : ''}.`)
  }
  if (visibleFields.some((f) => f.key === 'email')) {
    recs.push('Consider keeping email but revoking deeper scopes to reduce exposure.')
  }
  if (sensitive.length === 0) {
    recs.push(`${appName} only sees low-sensitivity data — safe to keep authorized.`)
  }
  return recs
}
