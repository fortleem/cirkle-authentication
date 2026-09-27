import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser, unauthorized, getClientIp, getUserAgent, recordAudit } from '@/lib/session'
import { finishPasskeyRegistration, verifyChallenge } from '@/lib/passkeys'

const FinishSchema = z.object({
  credential: z.any(),
  challengeToken: z.string(),
  name: z.string().max(40).optional(),
})

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return unauthorized('Please sign in')

  const body = await req.json().catch(() => null)
  const parsed = FinishSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid passkey registration' }, { status: 400 })
  }
  const verified = verifyChallenge(parsed.data.challengeToken)
  if (!verified) {
    return NextResponse.json({ error: 'Challenge expired or invalid' }, { status: 400 })
  }
  const result = await finishPasskeyRegistration(user.id, parsed.data.credential, verified.challenge, parsed.data.name)
  if (!result.ok) {
    return NextResponse.json({ error: result.error || 'Passkey verification failed' }, { status: 400 })
  }
  const ip = getClientIp(req)
  const ua = getUserAgent(req)
  await recordAudit({ userId: user.id, action: 'passkey.added', ip, userAgent: ua })
  return NextResponse.json({ ok: true })
}
