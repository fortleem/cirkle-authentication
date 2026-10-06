import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, unauthorized, getClientIp, getUserAgent, recordAudit } from '@/lib/session'
import { generateRecoveryCodes, hashRecoveryCodes } from '@/lib/recovery-codes'

// (Re)generate 10 one-time recovery codes. Returned ONCE; we only store the hash.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return unauthorized('Please sign in')

  const codes = generateRecoveryCodes()
  const blob = hashRecoveryCodes(codes)
  await db.user.update({
    where: { id: user.id },
    data: { recoveryCodesHash: blob, recoveryCodesGeneratedAt: new Date() },
  })

  const ip = getClientIp(req)
  const ua = getUserAgent(req)
  await recordAudit({ userId: user.id, action: 'recovery-codes.generated', ip, userAgent: ua })

  return NextResponse.json({ codes, generatedAt: new Date() })
}
