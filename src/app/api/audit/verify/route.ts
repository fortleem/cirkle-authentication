import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, unauthorized } from '@/lib/session'
import { createHash } from 'crypto'

// Verify the Merkle audit chain integrity — recompute every eventHash
// from prevHash + action + metadata + timestamp, and check they chain correctly.
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return unauthorized('Not authenticated')

  const events = await db.auditLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' },
    select: { id: true, action: true, metadata: true, prevHash: true, eventHash: true, createdAt: true },
  })

  let prevHash = '0'.repeat(64) // genesis
  let verified = 0
  let broken = 0
  const brokenAt: string[] = []

  for (const e of events) {
    const metadataStr = e.metadata ?? ''
    const ts = e.createdAt.getTime().toString()
    const computed = createHash('sha256')
      .update((e.prevHash ?? prevHash) + '|' + e.action + '|' + metadataStr + '|' + ts)
      .digest('hex')

    // Check the chain: prevHash should match the previous event's eventHash
    // AND the eventHash should match the recomputed hash
    const chainOk = (e.prevHash ?? prevHash) === prevHash
    const hashOk = e.eventHash === computed

    if (chainOk && hashOk) {
      verified++
    } else {
      broken++
      brokenAt.push(e.id)
    }
    prevHash = e.eventHash ?? computed
  }

  // The root hash = the last event's eventHash (bound to the PQ attestation)
  const rootHash = events.length > 0 ? events[events.length - 1].eventHash : null

  return NextResponse.json({
    total: events.length,
    verified,
    broken,
    brokenAt,
    rootHash,
    chainIntact: broken === 0,
  })
}
