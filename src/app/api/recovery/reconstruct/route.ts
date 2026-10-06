import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser, unauthorized, getClientIp, getUserAgent, recordAudit } from '@/lib/session'
import { reconstructSecret, verifySecret } from '@/lib/social-recovery'
import { createSessionToken, getSessionExpiry } from '@/lib/auth'
import { setSessionCookie } from '@/lib/session'

const ReconstructSchema = z.object({
  identifier: z.string().min(1, 'Enter the username or email to recover'),
  shares: z.array(z.string().min(10)).min(2, 'Provide at least the threshold number of shares'),
})

// Public: reconstruct the recovery secret from M guardian shares + sign in.
// (For the demo, the shares are stored on guardian rows; we also accept them
// directly from the user, simulating the out-of-band share collection.)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = ReconstructSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })
  }
  const { identifier, shares } = parsed.data
  const normalized = identifier.toLowerCase().trim()
  const isEmail = normalized.includes('@')

  const user = await db.user.findFirst({ where: isEmail ? { email: normalized } : { username: normalized } })
  if (!user || !user.twoFactorSecret?.startsWith('recovery:')) {
    return NextResponse.json({ error: 'Social recovery is not configured for this identity' }, { status: 404 })
  }
  const storedHash = user.twoFactorSecret.replace(/^recovery:/, '')

  // Reconstruct the secret from the provided shares
  const reconstructed = reconstructSecret(shares)
  if (!reconstructed) {
    return NextResponse.json({ error: 'Could not reconstruct the secret — not enough valid shares' }, { status: 401 })
  }

  // Verify against the stored hash
  if (!verifySecret(reconstructed, storedHash)) {
    return NextResponse.json({ error: 'Reconstructed secret does not match — wrong shares' }, { status: 401 })
  }

  // Success — create a fresh session
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
  await recordAudit({ userId: user.id, action: 'recovery.reconstructed', ip, userAgent: ua, metadata: { shares: shares.length } })

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  })
}
