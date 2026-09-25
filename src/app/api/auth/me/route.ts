import { NextResponse } from 'next/server'
import { getCurrentUser, unauthorized } from '@/lib/session'
import { db } from '@/lib/db'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return unauthorized('Not authenticated')

  const [appCount, sessionCount, auditCount, businesses] = await Promise.all([
    db.userAppAccess.count({ where: { userId: user.id } }),
    db.session.count({ where: { userId: user.id } }),
    db.auditLog.count({ where: { userId: user.id } }),
    db.business.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        legalName: true,
        type: true,
        country: true,
        industry: true,
        verified: true,
        createdAt: true,
      },
    }),
  ])

  return NextResponse.json({
    user,
    stats: {
      connectedApps: appCount,
      activeSessions: sessionCount,
      auditEvents: auditCount,
      businesses: businesses.length,
    },
    businesses,
  })
}
