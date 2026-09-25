import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, unauthorized } from '@/lib/session'

export async function GET() {
  const user = await getCurrentUser()

  const apps = await db.connectedApp.findMany({
    orderBy: [{ featured: 'desc' }, { name: 'asc' }],
  })

  const accessMap = user
    ? await db.userAppAccess.findMany({
        where: { userId: user.id },
        select: { appId: true, grantedAt: true, lastUsedAt: true, scopes: true, contextType: true, businessId: true },
      })
    : []

  const accessByAppId = new Map(accessMap.map((a) => [a.appId, a]))

  const appsWithAccess = apps.map((app) => {
    const access = accessByAppId.get(app.id)
    return {
      id: app.id,
      slug: app.slug,
      name: app.name,
      description: app.description,
      category: app.category,
      color: app.color,
      icon: app.icon,
      homepage: app.homepage,
      redirectUrl: app.redirectUrl,
      featured: app.featured,
      status: app.status,
      authorized: !!access,
      grantedAt: access?.grantedAt ?? null,
      lastUsedAt: access?.lastUsedAt ?? null,
      scopes: access?.scopes ?? null,
      contextType: access?.contextType ?? null,
      businessId: access?.businessId ?? null,
      // Dynamic authentication requirements per platform
      requirements: {
        identityType: app.identityType,
        verificationLevel: app.verificationLevel,
        twoFactorRequired: app.twoFactorRequired,
        businessRequired: app.businessRequired,
        requiredScopes: app.requiredScopes,
      },
    }
  })

  return NextResponse.json({
    apps: appsWithAccess,
    authenticated: !!user,
  })
}
