import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, unauthorized, getClientIp, getUserAgent, recordAudit } from '@/lib/session'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return unauthorized('Not authenticated')

  const { id } = await params
  const passkey = await db.passkey.findUnique({ where: { id } })
  if (!passkey || passkey.userId !== user.id) {
    return NextResponse.json({ error: 'Passkey not found' }, { status: 404 })
  }
  await db.passkey.delete({ where: { id } })

  const ip = getClientIp(req)
  const ua = getUserAgent(req)
  await recordAudit({ userId: user.id, action: 'passkey.removed', ip, userAgent: ua, metadata: { passkeyId: id } })

  return NextResponse.json({ ok: true })
}
