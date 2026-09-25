import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, unauthorized } from '@/lib/session'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return unauthorized('Not authenticated')

  const { id } = await params
  const session = await db.session.findUnique({ where: { id } })
  if (!session || session.userId !== user.id) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  await db.session.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
