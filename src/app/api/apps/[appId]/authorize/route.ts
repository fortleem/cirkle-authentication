import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, unauthorized, getClientIp, getUserAgent, recordAudit } from '@/lib/session'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return unauthorized('Please sign in to authorize apps')

  const { appId } = await params
  const body = await req.json().catch(() => ({}))
  const scopes = (body.scopes as string) || 'openid profile email'

  const app = await db.connectedApp.findUnique({ where: { id: appId } })
  if (!app) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  }

  await db.userAppAccess.upsert({
    where: { userId_appId: { userId: user.id, appId } },
    update: { scopes, grantedAt: new Date() },
    create: { userId: user.id, appId, scopes, grantedAt: new Date() },
  })

  const ip = getClientIp(req)
  const ua = getUserAgent(req)
  await recordAudit({
    userId: user.id,
    action: 'app.authorized',
    ip,
    userAgent: ua,
    metadata: { appId, appSlug: app.slug, appName: app.name, scopes },
  })

  return NextResponse.json({
    ok: true,
    redirectUrl: app.redirectUrl
      ? `${app.redirectUrl}?cirkle_user=${encodeURIComponent(user.id)}&app=${app.slug}`
      : null,
    app: { id: app.id, name: app.name, slug: app.slug, homepage: app.homepage },
  })
}
