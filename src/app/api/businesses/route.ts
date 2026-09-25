import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser, unauthorized, getClientIp, getUserAgent, recordAudit } from '@/lib/session'

const CreateSchema = z.object({
  name: z.string().min(2, 'Business name is required').max(80),
  legalName: z.string().max(120).optional(),
  taxId: z.string().max(60).optional(),
  type: z.enum(['sole', 'llc', 'corp', 'partnership']).default('sole'),
  country: z.string().max(60).optional(),
  industry: z.string().max(60).optional(),
})

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return unauthorized('Not authenticated')

  const businesses = await db.business.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      legalName: true,
      taxId: true,
      type: true,
      country: true,
      industry: true,
      verified: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ businesses })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return unauthorized('Not authenticated')

  const body = await req.json().catch(() => null)
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })
  }

  const b = parsed.data
  const business = await db.business.create({
    data: {
      name: b.name.trim(),
      legalName: b.legalName?.trim() || null,
      taxId: b.taxId?.trim() || null,
      type: b.type,
      country: b.country?.trim() || null,
      industry: b.industry?.trim() || null,
      verified: false,
      ownerId: user.id,
    },
  })

  // Link the owner as a member
  await db.userBusiness.create({
    data: { userId: user.id, businessId: business.id, role: 'owner' },
  })

  const ip = getClientIp(req)
  const ua = getUserAgent(req)
  await recordAudit({
    userId: user.id,
    action: 'business.created',
    ip,
    userAgent: ua,
    metadata: { businessId: business.id, name: business.name },
  })

  return NextResponse.json({ business })
}
