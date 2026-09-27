import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { createSessionToken, getSessionExpiry } from '@/lib/auth'
import { finishPasskeyAuthentication, verifyChallenge } from '@/lib/passkeys'
import { setSessionCookie, getClientIp, getUserAgent, recordAudit } from '@/lib/session'

const FinishSchema = z.object({
  credential: z.any(),
  challengeToken: z.string(),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = FinishSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid passkey login' }, { status: 400 })
  }
  const verified = verifyChallenge(parsed.data.challengeToken)
  if (!verified) {
    return NextResponse.json({ error: 'Challenge expired or invalid' }, { status: 400 })
  }
  const result = await finishPasskeyAuthentication(parsed.data.credential, verified.challenge)
  if (!result.ok || !result.userId) {
    return NextResponse.json({ error: result.error || 'Passkey login failed' }, { status: 401 })
  }
  const user = await db.user.findUnique({ where: { id: result.userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const token = createSessionToken({ userId: user.id, email: user.email, name: user.name, role: user.role })
  await db.session.create({
    data: {
      userId: user.id,
      token,
      ip: getClientIp(req),
      userAgent: getUserAgent(req),
      expiresAt: getSessionExpiry(),
    },
  })
  await setSessionCookie(token)
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

  const ip = getClientIp(req)
  const ua = getUserAgent(req)
  await recordAudit({ userId: user.id, action: 'session.login', ip, userAgent: ua, metadata: { via: 'passkey' } })

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      twoFactorEnabled: user.twoFactorEnabled,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      kycVerified: user.kycVerified,
      businessVerified: user.businessVerified,
      hasRecoveryCodes: !!user.recoveryCodesHash,
      hasPasskey: true,
      onboardingComplete: user.onboardingComplete,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      lastLoginAt: new Date(),
    },
  })
}
