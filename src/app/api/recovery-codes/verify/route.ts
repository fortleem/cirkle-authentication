import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { verifyPassword, createSessionToken, getSessionExpiry } from '@/lib/auth'
import { consumeRecoveryCode } from '@/lib/recovery-codes'
import { setSessionCookie, getClientIp, getUserAgent, recordAudit } from '@/lib/session'

const VerifySchema = z.object({
  identifier: z.string().min(1, 'Enter your username or email'),
  code: z.string().min(8, 'Enter a recovery code'),
})

// Public: sign in with a one-time recovery code (2FA fallback).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = VerifySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })
  }
  const { identifier, code } = parsed.data
  const normalized = identifier.toLowerCase().trim()
  const isEmail = normalized.includes('@')

  const user = await db.user.findFirst({ where: isEmail ? { email: normalized } : { username: normalized } })
  if (!user || !user.recoveryCodesHash) {
    return NextResponse.json({ error: 'Invalid recovery code' }, { status: 401 })
  }

  const consumed = await consumeRecoveryCode(user.id, code.trim().toUpperCase())
  if (!consumed) {
    return NextResponse.json({ error: 'Invalid or already-used recovery code' }, { status: 401 })
  }

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
  await recordAudit({ userId: user.id, action: 'recovery-code.used', ip, userAgent: ua })

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
