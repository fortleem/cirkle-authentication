import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, unauthorized } from '@/lib/session'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return unauthorized('Not authenticated')

  const logs = await db.auditLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      action: true,
      ip: true,
      userAgent: true,
      metadata: true,
      createdAt: true,
    },
  })

  return NextResponse.json({
    logs: logs.map((l) => ({
      ...l,
      metadata: l.metadata ? safeParse(l.metadata) : null,
    })),
  })
}

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s)
  } catch {
    return null
  }
}
