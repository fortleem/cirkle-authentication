import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { verifyPassword, createSessionToken, getSessionExpiry } from '@/lib/auth'
import { setSessionCookie, getClientIp, getUserAgent, recordAudit } from '@/lib/session'

const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const parsed = LoginSchema.safeParse(body)
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? 'Invalid input'
      return NextResponse.json({ error: firstError }, { status: 400 })
    }
    const { email, password } = parsed.data
    const normalizedEmail = email.toLowerCase().trim()

    const user = await db.user.findUnique({ where: { email: normalizedEmail } })
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
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
    await recordAudit({ userId: user.id, action: 'session.login', ip, userAgent: ua })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
        emailVerified: user.emailVerified,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        lastLoginAt: new Date(),
      },
    })
  } catch (e) {
    console.error('Login error', e)
    return NextResponse.json({ error: 'Failed to sign in. Please try again.' }, { status: 500 })
  }
}
