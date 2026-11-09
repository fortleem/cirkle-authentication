import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomBytes, createHash } from 'crypto'
import { db } from '@/lib/db'
import { getCurrentUser, unauthorized, getClientIp, getUserAgent, recordAudit } from '@/lib/session'

const CreateSchema = z.object({
  name: z.string().min(2, 'Name is required').max(40),
  scopes: z.string().max(100).default('identity:read'),
})

// Generate a new API key (returns the raw key ONCE — like recovery codes)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return unauthorized('Please sign in')

  const body = await req.json().catch(() => null)
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })
  }

  // Generate a raw key: cirk_sk_<32 random hex chars>
  const rawKey = `cirk_sk_${randomBytes(16).toString('hex')}`
  const hashedKey = createHash('sha256').update(rawKey).digest('hex')
  const prefix = rawKey.slice(0, 12) // cirk_sk_xxx

  const apiKey = await db.apiKey.create({
    data: {
      userId: user.id,
      name: parsed.data.name,
      hashedKey,
      prefix,
      scopes: parsed.data.scopes,
    },
  })

  const ip = getClientIp(req)
  const ua = getUserAgent(req)
  await recordAudit({ userId: user.id, action: 'apikey.created', ip, userAgent: ua, metadata: { name: parsed.data.name, keyId: apiKey.id } })

  return NextResponse.json({
    ok: true,
    key: rawKey, // shown ONCE
    id: apiKey.id,
    name: apiKey.name,
    prefix: apiKey.prefix,
    scopes: apiKey.scopes,
    createdAt: apiKey.createdAt,
    note: 'This key is shown once. Store it securely — it grants programmatic access to your Cirkle identity.',
  })
}

// List API keys (without the raw key — only prefix for identification)
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return unauthorized('Not authenticated')

  const keys = await db.apiKey.findMany({
    where: { userId: user.id, revokedAt: null },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, prefix: true, scopes: true, lastUsedAt: true, createdAt: true },
  })

  return NextResponse.json({ keys })
}
