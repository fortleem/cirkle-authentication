import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser, unauthorized, getClientIp, getUserAgent, recordAudit } from '@/lib/session'

const UpdateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  legalName: z.string().max(120).optional(),
  taxId: z.string().max(60).optional(),
  type: z.enum(['sole', 'llc', 'corp', 'partnership']).optional(),
  country: z.string().max(60).optional(),
  industry: z.string().max(60).optional(),
  verified: z.boolean().optional(),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return unauthorized('Not authenticated')

  const { id } = await params
  const business = await db.business.findUnique({ where: { id } })
  if (!business || business.ownerId !== user.id) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }
  return NextResponse.json({ business })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return unauthorized('Not authenticated')

  const { id } = await params
  const business = await db.business.findUnique({ where: { id } })
  if (!business || business.ownerId !== user.id) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  const body = await req.json().catch(() => null)
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const updated = await db.business.update({
    where: { id },
    data: parsed.data,
  })

  // Recompute the owner's businessVerified flag whenever verification changes
  if (parsed.data.verified !== undefined) {
    const remaining = await db.business.count({ where: { ownerId: user.id, verified: true } })
    await db.user.update({ where: { id: user.id }, data: { businessVerified: remaining > 0 } })
    if (parsed.data.verified) {
      await recordAudit({ userId: user.id, action: 'business.verified', ip: getClientIp(req), userAgent: getUserAgent(req), metadata: { businessId: id } })
    }
  }

  const ip = getClientIp(req)
  const ua = getUserAgent(req)
  await recordAudit({
    userId: user.id,
    action: 'business.updated',
    ip,
    userAgent: ua,
    metadata: { businessId: id, fields: Object.keys(parsed.data) },
  })

  return NextResponse.json({ business: updated })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return unauthorized('Not authenticated')

  const { id } = await params
  const business = await db.business.findUnique({ where: { id } })
  if (!business || business.ownerId !== user.id) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  await db.business.delete({ where: { id } })

  // Recompute businessVerified flag
  const remaining = await db.business.count({ where: { ownerId: user.id, verified: true } })
  await db.user.update({ where: { id: user.id }, data: { businessVerified: remaining > 0 } })

  const ip = getClientIp(req)
  const ua = getUserAgent(req)
  await recordAudit({ userId: user.id, action: 'business.deleted', ip, userAgent: ua, metadata: { businessId: id } })

  return NextResponse.json({ ok: true })
}
