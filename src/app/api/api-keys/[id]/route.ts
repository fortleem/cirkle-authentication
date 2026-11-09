import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, unauthorized, getClientIp, getUserAgent, recordAudit } from '@/lib/session'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return unauthorized('Not authenticated')

  const { id } = await params
  const key = await db.apiKey.findUnique({ where: { id } })
  if (!key || key.userId !== user.id) {
    return NextResponse.json({ error: 'API key not found' }, { status: 404 })
  }

  await db.apiKey.update({ where: { id }, data: { revokedAt: new Date() } })

  const ip = getClientIp(req)
  const ua = getUserAgent(req)
  await recordAudit({ userId: user.id, action: 'apikey.revoked', ip, userAgent: ua, metadata: { keyId: id, name: key.name } })

  return NextResponse.json({ ok: true })
}
