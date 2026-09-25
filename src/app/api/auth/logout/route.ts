import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifySessionToken } from '@/lib/auth'
import { getSessionToken, clearSessionCookie, getClientIp, getUserAgent, recordAudit } from '@/lib/session'

export async function POST(req: NextRequest) {
  try {
    const token = await getSessionToken()
    if (token) {
      const payload = verifySessionToken(token)
      const session = await db.session.findFirst({ where: { token } })
      if (session) {
        await db.session.delete({ where: { id: session.id } })
      }
      const ip = getClientIp(req)
      const ua = getUserAgent(req)
      await recordAudit({ userId: payload?.userId ?? null, action: 'session.logout', ip, userAgent: ua })
    }
    await clearSessionCookie()
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Logout error', e)
    return NextResponse.json({ error: 'Failed to sign out' }, { status: 500 })
  }
}
