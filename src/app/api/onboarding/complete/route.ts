import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, unauthorized, getClientIp, getUserAgent, recordAudit } from '@/lib/session'

// Mark onboarding complete (so the wizard stops showing for this user).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return unauthorized('Please sign in')

  await db.user.update({ where: { id: user.id }, data: { onboardingComplete: true } })

  const ip = getClientIp(req)
  const ua = getUserAgent(req)
  await recordAudit({ userId: user.id, action: 'onboarding.completed', ip, userAgent: ua })

  return NextResponse.json({ ok: true })
}
