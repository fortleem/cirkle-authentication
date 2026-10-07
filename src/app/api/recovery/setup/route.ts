import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser, unauthorized, getClientIp, getUserAgent, recordAudit } from '@/lib/session'
import { createRecoverySecret, distributeShares } from '@/lib/social-recovery'

const SetupSchema = z.object({
  guardians: z.array(z.object({ label: z.string().min(1).max(40), handle: z.string().min(2).max(60) })).min(2, 'Need at least 2 guardians').max(8, 'Max 8 guardians'),
  threshold: z.number().int().min(2).max(8),
})

// Configure social recovery: split a fresh secret into N shares, distribute to guardians.
// We store the SHA-256 hash of the secret on the user, and each share on a guardian row.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return unauthorized('Please sign in')

  const body = await req.json().catch(() => null)
  const parsed = SetupSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })
  }
  const { guardians, threshold } = parsed.data
  const total = guardians.length
  if (threshold > total) {
    return NextResponse.json({ error: 'Threshold cannot exceed the number of guardians' }, { status: 400 })
  }

  // Generate + split the secret
  const { secret, split } = createRecoverySecret(threshold, total)
  const sharesByGuardian = distributeShares(guardians.map((g) => g.handle), split.shares)

  // Replace any existing guardians
  await db.guardian.deleteMany({ where: { userId: user.id } })
  await db.user.update({
    where: { id: user.id },
    data: {
      // store the secret hash (not the secret) + the secret itself for the demo
      twoFactorSecret: `recovery:${split.secretHash}`,
    },
  })

  const guardianRows = await Promise.all(
    guardians.map((g) =>
      db.guardian.create({
        data: {
          userId: user.id,
          label: g.label,
          handle: g.handle,
          share: sharesByGuardian[g.handle] ?? '',
          threshold,
          total,
        },
      }),
    ),
  )

  // The shares are shown ONCE (like recovery codes) — we return them for the user to distribute
  const sharesOnce = guardianRows.map((g, i) => ({ id: g.id, label: g.label, handle: g.handle, share: split.shares[i] }))

  const ip = getClientIp(req)
  const ua = getUserAgent(req)
  await recordAudit({ userId: user.id, action: 'recovery.setup', ip, userAgent: ua, metadata: { total, threshold } })

  return NextResponse.json({
    ok: true,
    total,
    threshold,
    secretHash: split.secretHash,
    guardians: sharesOnce,
    note: 'These shares are shown once. Each guardian should receive exactly one share (printed / stored offline). The secret itself is not stored in plaintext.',
  })
}

// GET — list the user's guardian configuration (without exposing shares)
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return unauthorized('Not authenticated')

  const guardians = await db.guardian.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' },
    select: { id: true, label: true, handle: true, threshold: true, total: true, createdAt: true },
  })
  return NextResponse.json({ guardians })
}

// DELETE — tear down social recovery
export async function DELETE() {
  const user = await getCurrentUser()
  if (!user) return unauthorized('Not authenticated')
  await db.guardian.deleteMany({ where: { userId: user.id } })
  await db.user.update({ where: { id: user.id }, data: { twoFactorSecret: null } })
  return NextResponse.json({ ok: true })
}
