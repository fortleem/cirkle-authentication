import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser, unauthorized, getClientIp, getUserAgent, recordAudit } from '@/lib/session'

const PhoneSchema = z.object({
  phone: z.string().min(7, 'Enter a valid phone number').max(24),
})

// Add / re-add a phone number and mark it verified (preview flow — in prod this would
// send an OTP and verify it).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return unauthorized('Not authenticated')

  const body = await req.json().catch(() => null)
  const parsed = PhoneSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid phone' }, { status: 400 })
  }

  await db.user.update({
    where: { id: user.id },
    data: { phone: parsed.data.phone.trim(), phoneVerified: true },
  })

  const ip = getClientIp(req)
  const ua = getUserAgent(req)
  await recordAudit({ userId: user.id, action: 'phone.verified', ip, userAgent: ua, metadata: { phone: parsed.data.phone } })

  return NextResponse.json({ ok: true, phone: parsed.data.phone, phoneVerified: true })
}
