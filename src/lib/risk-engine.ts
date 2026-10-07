// Adaptive Risk Engine — algorithmic real-time risk scoring for every identity
// action. Combines device/IP novelty, action sensitivity, session age, recent
// failures, and 2FA posture into a 0-100 score + a step-up recommendation.
// Years ahead of any competitor's flat "verified / not verified" model.

export type RiskLevel = 'low' | 'moderate' | 'elevated' | 'high' | 'critical'

export interface RiskFactor {
  key: string
  label: string
  contribution: number // points added to the score (0-100 scale)
  detail: string
}

export interface RiskInput {
  action: string // e.g. 'app.authorize', 'session.login', 'brain.ask', 'passkey.add'
  ip: string | null
  knownIps: string[] // IPs the user has signed in from before
  sessionAgeMs: number
  recentFailures: number // failed auth attempts in the last hour
  twoFactorEnabled: boolean
  hasPasskey: boolean
}

export interface RiskScore {
  score: number // 0-100
  level: RiskLevel
  factors: RiskFactor[]
  stepUpRequired: boolean
  stepUpThreshold: number
}

// Action sensitivity weights (how risky is this action intrinsically?)
const ACTION_SENSITIVITY: Record<string, number> = {
  'session.login': 12,
  'session.logout': 4,
  'app.authorize': 22, // granting access to an app
  'app.revoked': 8,
  'passkey.add': 18,
  'passkey.removed': 14,
  'recovery-codes.generated': 16,
  'business.created': 14,
  'business.verified': 20,
  'brain.ask': 5,
  'recovery.setup': 30, // configuring social recovery — highest sensitivity
  'kyc.completed': 10,
  'onboarding.completed': 3,
}

const STEP_UP_THRESHOLD = 60

export function computeRiskScore(input: RiskInput): RiskScore {
  const factors: RiskFactor[] = []

  // 1. Device / IP novelty — is this a known device/network?
  const ip = (input.ip ?? '').replace(/^::ffff:/, '')
  const isKnownIp = ip && input.knownIps.includes(ip)
  const ipContribution = isKnownIp ? 0 : ip ? 25 : 18 // unknown IP = +25, no IP info = +18
  factors.push({
    key: 'device',
    label: 'Device / IP novelty',
    contribution: ipContribution,
    detail: isKnownIp ? 'Known device/network' : ip ? `New IP: ${ip}` : 'No IP information',
  })

  // 2. Action sensitivity
  const sensitivity = ACTION_SENSITIVITY[input.action] ?? 10
  factors.push({
    key: 'sensitivity',
    label: 'Action sensitivity',
    contribution: sensitivity,
    detail: `${input.action} — intrinsic risk weight ${sensitivity}`,
  })

  // 3. Session age — very new OR very old sessions are slightly riskier for sensitive actions
  const mins = input.sessionAgeMs / 60000
  let ageContribution = 0
  let ageDetail = `Session age: ${Math.round(mins)} min`
  if (mins < 5) {
    ageContribution = 12
    ageDetail = `Very fresh session (${Math.round(mins)} min) — higher risk for sensitive actions`
  } else if (mins > 60 * 24 * 20) {
    ageContribution = 8
    ageDetail = `Stale session (>20 days) — consider re-auth`
  } else {
    ageContribution = 3
    ageDetail = `Session age: ${Math.round(mins)} min — normal`
  }
  factors.push({ key: 'session', label: 'Session age', contribution: ageContribution, detail: ageDetail })

  // 4. Recent failures — repeated failed auth suggests an attack
  const failContribution = Math.min(input.recentFailures * 6, 24)
  factors.push({
    key: 'failures',
    label: 'Recent failures',
    contribution: failContribution,
    detail: input.recentFailures > 0 ? `${input.recentFailures} failed attempt(s) in the last hour` : 'No recent failures',
  })

  // 5. 2FA posture — no second factor = more risk
  const twoFaContribution = input.twoFactorEnabled ? 0 : 14
  factors.push({
    key: '2fa',
    label: '2FA posture',
    contribution: twoFaContribution,
    detail: input.twoFactorEnabled ? '2FA enabled — second factor present' : 'No 2FA — single factor only',
  })

  // 6. Passkey posture — phishing-resistant credential reduces risk
  const passkeyContribution = input.hasPasskey ? -6 : 0 // discount for having a passkey
  factors.push({
    key: 'passkey',
    label: 'Passkey posture',
    contribution: passkeyContribution,
    detail: input.hasPasskey ? 'Passkey registered — phishing-resistant credential present' : 'No passkey',
  })

  const rawScore = factors.reduce((a, f) => a + f.contribution, 0)
  const score = Math.max(0, Math.min(100, rawScore))
  const level: RiskLevel = score >= 80 ? 'critical' : score >= 65 ? 'high' : score >= 45 ? 'elevated' : score >= 25 ? 'moderate' : 'low'

  return {
    score,
    level,
    factors,
    stepUpRequired: score >= STEP_UP_THRESHOLD,
    stepUpThreshold: STEP_UP_THRESHOLD,
  }
}

export function levelColor(level: RiskLevel): string {
  return level === 'critical'
    ? 'hsl(var(--rose))'
    : level === 'high'
      ? 'hsl(351 41% 56%)'
      : level === 'elevated'
        ? 'hsl(var(--gold))'
        : level === 'moderate'
          ? 'hsl(var(--steel))'
          : 'hsl(var(--teal))'
}

export function levelLabel(level: RiskLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1)
}

/** A live "radar" sample: simulate the risk of authorizing a strict-level app right now. */
export function sampleStrictAppRisk(input: Omit<RiskInput, 'action'>): RiskScore {
  return computeRiskScore({ ...input, action: 'app.authorize' })
}
