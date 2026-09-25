import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, unauthorized, getClientIp, getUserAgent, recordAudit } from '@/lib/session'

// Start a KYC verification. In production this hands off to Cirkle Verify;
// in this preview it stages the KYC and returns a verification token the
// client can use to "complete" the flow.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return unauthorized('Not authenticated')

  const token = `kyc_${user.id.slice(0, 8)}_${Date.now().toString(36)}`
  const ip = getClientIp(req)
  const ua = getUserAgent(req)
  await recordAudit({ userId: user.id, action: 'kyc.started', ip, userAgent: ua, metadata: { token } })

  return NextResponse.json({
    ok: true,
    token,
    message: 'KYC session staged. Complete the document + selfie check to verify.',
  })
}

// Complete the staged KYC flow (preview — marks the user verified).
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return unauthorized('Not authenticated')

  await db.user.update({ where: { id: user.id }, data: { kycVerified: true } })

  const ip = getClientIp(req)
  const ua = getUserAgent(req)
  await recordAudit({ userId: user.id, action: 'kyc.completed', ip, userAgent: ua })

  return NextResponse.json({ ok: true, kycVerified: true })
}
