import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser, unauthorized, getClientIp, getUserAgent, recordAudit } from '@/lib/session'
import { generatePQAttestation, verifyPQAttestation } from '@/lib/post-quantum'

const IssueSchema = z.object({
  type: z.enum(['CirkleEmailVerification', 'CirkleKYCVerified', 'CirkleBusinessVerified', 'CirklePhoneVerified', 'Cirkle2FAEnabled']),
})

const CREDENTIAL_TYPES: Record<string, { attribute: string; check: (u: any) => boolean }> = {
  CirkleEmailVerification: { attribute: 'email', check: (u) => u.emailVerified },
  CirkleKYCVerified: { attribute: 'kyc', check: (u) => u.kycVerified },
  CirkleBusinessVerified: { attribute: 'business', check: (u) => u.businessVerified },
  CirklePhoneVerified: { attribute: 'phone', check: (u) => u.phoneVerified },
  Cirkle2FAEnabled: { attribute: '2fa', check: (u) => u.twoFactorEnabled },
}

// Issue a verifiable credential for a verified attribute, signed with the
// user's post-quantum ML-DSA-65 key. The credential proves the attribute
// is verified without revealing the underlying personal data.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return unauthorized('Please sign in')

  const body = await req.json().catch(() => null)
  const parsed = IssueSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid type' }, { status: 400 })
  }

  const type = parsed.data.type
  const def = CREDENTIAL_TYPES[type]
  if (!def) return NextResponse.json({ error: 'Unknown credential type' }, { status: 400 })

  // Check the attribute is actually verified
  const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { emailVerified: true, kycVerified: true, businessVerified: true, phoneVerified: true, twoFactorEnabled: true, pqAttestationPubKey: true, pqAttestationSig: true, pqAttestationMsg: true } })
  if (!def.check(dbUser)) {
    return NextResponse.json({ error: `Attribute "${def.attribute}" is not verified — complete verification first` }, { status: 422 })
  }

  // Re-use the user's PQ attestation keypair to sign the credential
  if (!dbUser.pqAttestationPubKey || !dbUser.pqAttestationSig || !dbUser.pqAttestationMsg) {
    return NextResponse.json({ error: 'Issue a PQ attestation first (Quantum tab)' }, { status: 422 })
  }

  // Verify the existing PQ attestation is valid (so we trust the key)
  const pqValid = verifyPQAttestation({ publicKey: dbUser.pqAttestationPubKey, signature: dbUser.pqAttestationSig, message: dbUser.pqAttestationMsg })
  if (!pqValid) {
    return NextResponse.json({ error: 'PQ attestation is invalid — re-issue it' }, { status: 422 })
  }

  // Generate a fresh PQ signature for the credential
  const att = generatePQAttestation(user.id, user.username, `${type}:${def.attribute}`)
  const subject = {
    userId: user.id,
    username: user.username,
    attribute: def.attribute,
    type,
    verified: true,
    verifiedAt: new Date().toISOString(),
  }
  const message = `cirkle-vc\niss: Cirkle Authentication\nsub: ${user.username}\ntype: ${type}\nattr: ${def.attribute}\nverified: true\nissued: ${att.createdAt}`

  // Re-sign the credential message with the PQ key
  // (we use generatePQAttestation's signature over a credential-specific message)
  const credential = await db.credential.create({
    data: {
      userId: user.id,
      type,
      subject: JSON.stringify(subject),
      issuer: 'Cirkle Authentication',
      signature: att.signature,
      algorithm: att.algorithm,
      message,
    },
  })

  const ip = getClientIp(req)
  const ua = getUserAgent(req)
  await recordAudit({ userId: user.id, action: 'credential.issued', ip, userAgent: ua, metadata: { type, credentialId: credential.id } })

  return NextResponse.json({
    ok: true,
    credential: {
      id: credential.id,
      type,
      subject,
      issuer: 'Cirkle Authentication',
      algorithm: att.algorithm,
      createdAt: credential.createdAt,
      message,
    },
  })
}

// List the user's credentials
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return unauthorized('Not authenticated')

  const credentials = await db.credential.findMany({
    where: { userId: user.id, revokedAt: null },
    orderBy: { createdAt: 'desc' },
    select: { id: true, type: true, subject: true, issuer: true, algorithm: true, message: true, createdAt: true },
  })

  return NextResponse.json({
    credentials: credentials.map((c) => ({ ...c, subject: JSON.parse(c.subject) })),
  })
}
