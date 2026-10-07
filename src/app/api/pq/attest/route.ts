import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, unauthorized, getClientIp, getUserAgent, recordAudit } from '@/lib/session'
import { generatePQAttestation, sha256Hex, type PQAttestation } from '@/lib/post-quantum'
import { computePostureScore, CRYPTO_PRIMITIVES } from '@/lib/quantum-readiness'

// Generate (or regenerate) a fresh ML-DSA-65 post-quantum attestation binding
// the user's identity + current posture to a lattice-based PQ keypair.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return unauthorized('Please sign in')

  // Compute the current posture hash to bind into the attestation
  const posture = computePostureScore(CRYPTO_PRIMITIVES)
  const postureHash = sha256Hex(`${user.id}:${user.username}:${posture.score}:${posture.level}`)

  const att = generatePQAttestation(user.id, user.username, postureHash)

  await db.user.update({
    where: { id: user.id },
    data: {
      pqAttestationPubKey: att.publicKey,
      pqAttestationSig: att.signature,
      pqAttestationMsg: att.message,
      pqAttestationAt: new Date(),
    },
  })

  const ip = getClientIp(req)
  const ua = getUserAgent(req)
  await recordAudit({
    userId: user.id,
    action: 'pq.attestation.generated',
    ip,
    userAgent: ua,
    metadata: { algorithm: att.algorithm, securityLevel: att.securityLevel, posture: posture.score },
  })

  const publicResponse: PQAttestation = {
    publicKey: att.publicKey,
    signature: att.signature,
    message: att.message,
    algorithm: att.algorithm,
    securityLevel: att.securityLevel,
    createdAt: att.createdAt,
  }
  return NextResponse.json({ attestation: publicResponse, posture })
}
