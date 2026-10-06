import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, unauthorized } from '@/lib/session'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return unauthorized('Not authenticated')

  const passkeys = await db.passkey.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      deviceType: true,
      createdAt: true,
      lastUsedAt: true,
    },
  })
  return NextResponse.json({ passkeys })
}
