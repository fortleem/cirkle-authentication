import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { verifyPassword, createSessionToken, getSessionExpiry } from '@/lib/auth'
import { setSessionCookie, getClientIp, getUserAgent, recordAudit } from '@/lib/session'

const UnlockSchema = z.object({
  identifier: z.string().min(1, 'Enter your username or email'),
  password: z.string().min(1, 'Enter your password'),
})

// Emergency unlock: re-authenticate with the password to lift the lockdown.
// Creates a fresh session + clears the locked flag.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = UnlockSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })
  }
  const { identifier, password } = parsed.data
  const normalized = identifier.toLowerCase().trim()
  const isEmail = normalized.includes('@')

  const user = await db.user.findFirst({ where: isEmail ? { email: normalized } : { username: normalized } })
  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }
  if (!user.locked) {
    return NextResponse.json({ error: 'This identity is not under lockdown — sign in normally.' }, { status: 400 })
  }

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  // Lift the lockdown
  await db.user.update({
    where: { id: user.id },
    data: { locked: false, lockedAt: null, lastLoginAt: new Date() },
  })

  // Create a fresh session
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

  const ip = getClientIp(req)
  const ua = getUserAgent(req)
  await recordAudit({ userId: user.id, action: 'emergency.unlock', ip, userAgent: ua })

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      locked: false,
    },
  })
}
