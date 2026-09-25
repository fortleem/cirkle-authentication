import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, unauthorized, getClientIp, getUserAgent, recordAudit } from '@/lib/session'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return unauthorized('Please sign in to manage app access')

  const { appId } = await params
  const app = await db.connectedApp.findUnique({ where: { id: appId } })
  if (!app) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  }

  await db.userAppAccess.deleteMany({ where: { userId: user.id, appId } })

  const ip = getClientIp(req)
  const ua = getUserAgent(req)
  await recordAudit({
    userId: user.id,
    action: 'app.revoked',
    ip,
    userAgent: ua,
    metadata: { appId, appSlug: app.slug, appName: app.name },
  })

  return NextResponse.json({ ok: true })
}
