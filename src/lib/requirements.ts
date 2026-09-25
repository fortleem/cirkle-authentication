// Dynamic authentication requirement engine for the Cirkle ecosystem.
// Each platform declares its own requirement profile; this engine checks
// a user's verification state against that profile and reports what's missing.

export type IdentityType = 'personal' | 'business' | 'either'
export type VerificationLevel = 'basic' | 'enhanced' | 'strict'

export interface AppRequirements {
  identityType: IdentityType
  verificationLevel: VerificationLevel
  twoFactorRequired: boolean
  businessRequired: boolean
  requiredScopes: string
}

export interface UserVerificationState {
  emailVerified: boolean
  phoneVerified: boolean
  kycVerified: boolean
  twoFactorEnabled: boolean
  businessVerified: boolean
}

export type RequirementKey =
  | 'email'
  | 'phone'
  | 'kyc'
  | 'twoFactor'
  | 'business'

export interface RequirementCheck {
  key: RequirementKey
  label: string
  description: string
  met: boolean
}

/**
 * Compute the ordered list of requirement checks for an app, marking which
 * are met by the current user's verification state.
 */
export function checkRequirements(
  app: AppRequirements,
  user: UserVerificationState,
): RequirementCheck[] {
  const checks: RequirementCheck[] = []

  // Identity / business context
  if (app.businessRequired || app.identityType === 'business') {
    checks.push({
      key: 'business',
      label: 'Verified business profile',
      description: 'A linked and verified business is required to use this platform.',
      met: user.businessVerified,
    })
  }

  // Verification level ladder — higher levels include the lower ones
  if (app.verificationLevel === 'basic') {
    checks.push({
      key: 'email',
      label: 'Verified email',
      description: 'Your email address must be verified.',
      met: user.emailVerified,
    })
  }
  if (app.verificationLevel === 'enhanced' || app.verificationLevel === 'strict') {
    checks.push({
      key: 'email',
      label: 'Verified email',
      description: 'Your email address must be verified.',
      met: user.emailVerified,
    })
    checks.push({
      key: 'phone',
      label: 'Verified phone number',
      description: 'A verified phone adds a recovery channel and stronger identity.',
      met: user.phoneVerified,
    })
  }
  if (app.verificationLevel === 'strict') {
    checks.push({
      key: 'kyc',
      label: 'Identity verification (KYC)',
      description: 'Government ID and selfie verification via Cirkle Verify.',
      met: user.kycVerified,
    })
  }

  // Two-factor
  if (app.twoFactorRequired) {
    checks.push({
      key: 'twoFactor',
      label: 'Two-factor authentication',
      description: 'A one-time code is required at every sign-in to this platform.',
      met: user.twoFactorEnabled,
    })
  }

  return checks
}

export function isAuthorized(app: AppRequirements, user: UserVerificationState): boolean {
  return checkRequirements(app, user).every((c) => c.met)
}

export function requirementSummary(app: AppRequirements): string[] {
  const parts: string[] = []
  if (app.identityType === 'business' || app.businessRequired) parts.push('Business profile')
  if (app.verificationLevel === 'basic') parts.push('Email')
  if (app.verificationLevel === 'enhanced') parts.push('Email + Phone')
  if (app.verificationLevel === 'strict') parts.push('KYC')
  if (app.twoFactorRequired) parts.push('2FA')
  return parts
}

export function verificationLevelLabel(level: VerificationLevel): string {
  return level === 'basic' ? 'Basic' : level === 'enhanced' ? 'Enhanced' : 'Strict'
}

export function identityTypeLabel(type: IdentityType): string {
  return type === 'personal' ? 'Personal' : type === 'business' ? 'Business' : 'Personal or Business'
}
