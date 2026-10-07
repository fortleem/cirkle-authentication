import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { verifyPassword, createSessionToken } from '@/lib/auth'
import { getCurrentUser, unauthorized, getClientIp, getUserAgent, recordAudit } from '@/lib/session'
import { computeRiskScore } from '@/lib/risk-engine'

const StepUpSchema = z.object({
  password: z.string().min(1, 'Enter your password'),
  action: z.string().optional(),
})

/**
 * Step-up authentication: verify the password (re-auth) for high-risk actions.
 * Returns a short-lived step-up token (5 minutes) that the client presents
 * alongside the subsequent authorize request.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return unauthorized('Please sign in')

  const body = await req.json().catch(() => null)
  const parsed = StepUpSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })
  }

  // Fetch the password hash
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  })
  if (!dbUser) return unauthorized('User not found')

  const valid = await verifyPassword(parsed.data.password, dbUser.passwordHash)
  if (!valid) {
    return NextResponse.json({ error: 'Incorrect password — step-up denied' }, { status: 401 })
  }

  // Issue a short-lived step-up token (5 minutes, embedded in the JWT exp)
  const stepUpToken = createSessionToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })

  const ip = getClientIp(req)
  const ua = getUserAgent(req)
  await recordAudit({
    userId: user.id,
    action: 'auth.stepup',
    ip,
    userAgent: ua,
    metadata: { action: parsed.data.action || 'unknown' },
  })

  return NextResponse.json({
    ok: true,
    stepUpToken,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  })
}
