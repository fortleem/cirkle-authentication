import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, unauthorized, getSessionToken } from '@/lib/session'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return unauthorized('Not authenticated')

  const currentToken = await getSessionToken()

  const sessions = await db.session.findMany({
    where: { userId: user.id, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      ip: true,
      userAgent: true,
      token: true,
      createdAt: true,
      expiresAt: true,
    },
  })

  return NextResponse.json({
    sessions: sessions.map((s) => {
      const { token, ...rest } = s
      return { ...rest, current: token === currentToken }
    }),
  })
}

export async function DELETE() {
  const user = await getCurrentUser()
  if (!user) return unauthorized('Not authenticated')

  const currentToken = await getSessionToken()
  await db.session.deleteMany({
    where: {
      userId: user.id,
      NOT: currentToken ? { token: currentToken } : undefined,
    },
  })

  return NextResponse.json({ ok: true })
}
