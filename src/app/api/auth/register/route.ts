import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { hashPassword, createSessionToken, getSessionExpiry } from '@/lib/auth'
import { setSessionCookie, getClientIp, getUserAgent, recordAudit } from '@/lib/session'

const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60),
  email: z.string().email('Please enter a valid email address').max(120),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const parsed = RegisterSchema.safeParse(body)
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? 'Invalid input'
      return NextResponse.json({ error: firstError }, { status: 400 })
    }
    const { name, email, password } = parsed.data
    const normalizedEmail = email.toLowerCase().trim()

    const existing = await db.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)
    const user = await db.user.create({
      data: {
        email: normalizedEmail,
        name: name.trim(),
        passwordHash,
        role: 'member',
        emailVerified: true,
        lastLoginAt: new Date(),
      },
    })

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
    await recordAudit({ userId: user.id, action: 'user.registered', ip, userAgent: ua })
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
        lastLoginAt: user.lastLoginAt,
      },
    })
  } catch (e) {
    console.error('Register error', e)
    return NextResponse.json({ error: 'Failed to create account. Please try again.' }, { status: 500 })
  }
}
