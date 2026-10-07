import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, unauthorized } from '@/lib/session'
import { verifyPQAttestation } from '@/lib/post-quantum'
import { computePostureScore, CRYPTO_PRIMITIVES } from '@/lib/quantum-readiness'

// Verify the stored ML-DSA-65 PQ attestation (returns whether the lattice
// signature is valid + the public key + the bound posture).
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return unauthorized('Not authenticated')

  const u = await db.user.findUnique({
    where: { id: user.id },
    select: {
      pqAttestationPubKey: true,
      pqAttestationSig: true,
      pqAttestationMsg: true,
      pqAttestationAt: true,
      username: true,
    },
  })

  if (!u?.pqAttestationPubKey || !u?.pqAttestationSig || !u?.pqAttestationMsg) {
    return NextResponse.json({ hasAttestation: false, posture: computePostureScore(CRYPTO_PRIMITIVES) })
  }

  const valid = verifyPQAttestation({
    publicKey: u.pqAttestationPubKey,
    signature: u.pqAttestationSig,
    message: u.pqAttestationMsg,
  })

  return NextResponse.json({
    hasAttestation: true,
    valid,
    publicKey: u.pqAttestationPubKey,
    message: u.pqAttestationMsg,
    createdAt: u.pqAttestationAt,
    posture: computePostureScore(CRYPTO_PRIMITIVES),
  })
}
