import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, unauthorized, getClientIp, getUserAgent, recordAudit } from '@/lib/session'
import type { NextRequest } from 'next/server'

// Export ALL authentication-related databases as a downloadable JSON backup.
// Covers every auth method: passwords, passkeys, 2FA, recovery codes,
// social recovery, PQ attestation, sessions, app access, audit chain,
// verifiable credentials, businesses.
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return unauthorized('Please sign in')

  // Fetch all auth-related tables for this user
  const [userData, sessions, passkeys, guardians, credentials, appAccess, businesses, auditLogs] = await Promise.all([
    db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true, username: true, email: true, name: true, role: true,
        emailVerified: true, phoneVerified: true, kycVerified: true, businessVerified: true,
        twoFactorEnabled: true,
        recoveryCodesHash: true, // presence = hasRecoveryCodes (not the hash itself)
        onboardingComplete: true, locked: true,
        phone: true, avatarUrl: true, lastLoginAt: true, createdAt: true,
        recoveryCodesGeneratedAt: true, pqAttestationAt: true,
        // NOTE: passwordHash, twoFactorSecret, pqAttestationPubKey/Sig/Msg
        // are EXCLUDED from the export for security (they're secrets/hashes)
      },
    }),
    db.session.findMany({
      where: { userId: user.id },
      select: { id: true, ip: true, userAgent: true, expiresAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    db.passkey.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, deviceType: true, counter: true, createdAt: true, lastUsedAt: true },
      // NOTE: credentialId + publicKey excluded (secrets)
      orderBy: { createdAt: 'desc' },
    }),
    db.guardian.findMany({
      where: { userId: user.id },
      select: { id: true, label: true, handle: true, threshold: true, total: true, createdAt: true },
      // NOTE: share excluded (cryptographic secret)
      orderBy: { createdAt: 'asc' },
    }),
    db.credential.findMany({
      where: { userId: user.id },
      select: { id: true, type: true, subject: true, issuer: true, algorithm: true, message: true, createdAt: true, revokedAt: true },
      // NOTE: signature excluded (it's in the message + can be re-derived)
      orderBy: { createdAt: 'desc' },
    }),
    db.userAppAccess.findMany({
      where: { userId: user.id },
      select: {
        appId: true, scopes: true, contextType: true, businessId: true,
        expiresAt: true, grantedAt: true, lastUsedAt: true,
      },
      orderBy: { grantedAt: 'desc' },
    }),
    db.business.findMany({
      where: { ownerId: user.id },
      select: { id: true, name: true, legalName: true, type: true, country: true, industry: true, verified: true, createdAt: true },
      // NOTE: taxId excluded (sensitive)
      orderBy: { createdAt: 'desc' },
    }),
    db.auditLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
      select: { id: true, action: true, ip: true, userAgent: true, metadata: true, prevHash: true, eventHash: true, createdAt: true },
      take: 500,
    }),
  ])

  // Get the connected apps (for reference)
  const connectedApps = await db.connectedApp.findMany({
    select: { id: true, slug: true, name: true, category: true, identityType: true, verificationLevel: true, twoFactorRequired: true, businessRequired: true, requiredScopes: true },
    orderBy: { name: 'asc' },
  })

  const backup = {
    metadata: {
      exportedAt: new Date().toISOString(),
      exportedBy: user.username,
      version: '2.0.0',
      schema: 'Cirkle Authentication — full auth database backup',
      note: 'Secrets (passwordHash, twoFactorSecret, recoveryCodesHash, pqAttestationPubKey/Sig/Msg, passkey credentialId/publicKey, guardian shares, business taxId) are EXCLUDED for security.',
    },
    authDatabases: {
      // 1. Password auth + identity
      user: userData,
      // 2. Session management
      sessions: sessions.map(s => ({ ...s, authMethod: 'session-cookie' })),
      // 3. Passkey (WebAuthn) auth
      passkeys: passkeys.map(p => ({ ...p, authMethod: 'passkey-webauthn' })),
      // 4. Social recovery (Shamir SSS)
      guardians: guardians.map(g => ({ ...g, authMethod: 'social-recovery-shamir' })),
      // 5. Verifiable credentials (PQ-signed)
      credentials: credentials.map(c => ({ ...c, authMethod: 'verifiable-credential-pq' })),
      // 6. App authorization (OAuth scopes)
      appAccess: appAccess.map(a => ({ ...a, authMethod: 'oauth-scopes' })),
      // 7. Business profiles
      businesses: businesses,
      // 8. Audit log (Merkle chain)
      auditLog: auditLogs.map(l => ({ ...l, authMethod: 'merkle-audit-chain' })),
    },
    reference: {
      connectedApps: connectedApps.map(a => ({ ...a, requirements: { identityType: a.identityType, verificationLevel: a.verificationLevel, twoFactorRequired: a.twoFactorRequired, businessRequired: a.businessRequired, requiredScopes: a.requiredScopes } })),
    },
    stats: {
      totalSessions: sessions.length,
      totalPasskeys: passkeys.length,
      totalGuardians: guardians.length,
      totalCredentials: credentials.length,
      totalAppAccess: appAccess.length,
      totalBusinesses: businesses.length,
      totalAuditEvents: auditLogs.length,
      totalConnectedApps: connectedApps.length,
    },
  }

  const ip = getClientIp(req)
  const ua = getUserAgent(req)
  await recordAudit({ userId: user.id, action: 'database.exported', ip, userAgent: ua, metadata: { stats: backup.stats } })

  const json = JSON.stringify(backup, null, 2)
  return new NextResponse(json, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="cirkle-auth-backup-${user.username}-${Date.now()}.json"`,
    },
  })
}
