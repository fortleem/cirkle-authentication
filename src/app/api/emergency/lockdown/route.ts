import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, unauthorized, clearSessionCookie, getClientIp, getUserAgent, recordAudit } from '@/lib/session'

// Emergency lockdown: instantly revoke ALL sessions + ALL app authorizations +
// lock the account. The current session is also killed. Sign-in is blocked
// until the user re-authenticates via the unlock flow.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return unauthorized('Please sign in')

  const userId = user.id

  // Revoke every session
  await db.session.deleteMany({ where: { userId } })
  // Revoke every app authorization
  await db.userAppAccess.deleteMany({ where: { userId } })
  // Lock the account
  await db.user.update({
    where: { id: userId },
    data: { locked: true, lockedAt: new Date() },
  })

  // Clear the current session cookie
  await clearSessionCookie()

  const ip = getClientIp(req)
  const ua = getUserAgent(req)
  await recordAudit({ userId, action: 'emergency.lockdown', ip, userAgent: ua, metadata: { allSessions: true, allApps: true } })

  return NextResponse.json({ ok: true, locked: true, message: 'Emergency lockdown activated. All sessions and app authorizations revoked. Sign-in is blocked until emergency unlock.' })
}
