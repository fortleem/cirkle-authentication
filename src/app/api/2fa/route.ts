import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser, unauthorized, getClientIp, getUserAgent, recordAudit } from '@/lib/session'

const ToggleSchema = z.object({ enabled: z.boolean() })

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return unauthorized('Not authenticated')

  const body = await req.json().catch(() => null)
  const parsed = ToggleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const enabled = parsed.data.enabled
  // For demo purposes we generate a placeholder secret. In production use a real TOTP library.
  const secret = enabled ? `CIRKLE-${user.id.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}` : null

  await db.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: enabled, twoFactorSecret: secret },
  })

  const ip = getClientIp(req)
  const ua = getUserAgent(req)
  await recordAudit({
    userId: user.id,
    action: enabled ? '2fa.enabled' : '2fa.disabled',
    ip,
    userAgent: ua,
  })

  return NextResponse.json({ ok: true, twoFactorEnabled: enabled })
}
