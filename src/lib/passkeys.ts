import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type VerifiedRegistrationResponse,
  type VerifiedAuthenticationResponse,
} from '@simplewebauthn/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { db } from './db'

// In local dev the RP ID is localhost; in production it's the deploy domain.
export const RP_ID = process.env.NEXT_PUBLIC_RP_ID || process.env.VERCEL_URL || 'localhost'
export const RP_NAME = process.env.NEXT_PUBLIC_RP_NAME || 'Cirkle Authentication'
// The origin that's allowed to invoke WebAuthn ceremonies.
export function getOrigin(reqOrigin?: string): string {
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_APP_URL || reqOrigin || `https://${RP_ID}`
  }
  return 'http://localhost:3000'
}

// Stateless challenge store: HMAC-sign the challenge so the client can hold it
// between start/finish and the server can verify integrity without a DB row.
const CHALLENGE_SECRET = process.env.JWT_SECRET || 'cirkle-auth-dev-secret-2025'

export function signChallenge(challenge: string, userId?: string): string {
  const payload = `${userId ?? ''}.${challenge}.${Date.now()}`
  const mac = createHmac('sha256', CHALLENGE_SECRET).update(payload).digest('hex')
  return Buffer.from(`${payload}:${mac}`).toString('base64url')
}

export function verifyChallenge(token: string, maxAgeMs = 5 * 60 * 1000): { challenge: string; userId?: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString()
    const [payload, mac] = decoded.split(':')
    if (!payload || !mac) return null
    const expected = createHmac('sha256', CHALLENGE_SECRET).update(payload).digest('hex')
    if (!timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null
    const [userId, challenge, ts] = payload.split('.')
    const age = Date.now() - Number(ts)
    if (Number.isNaN(age) || age > maxAgeMs) return null
    return { challenge, userId: userId || undefined }
  } catch {
    return null
  }
}

/** Start passkey registration — returns the options the browser feeds to navigator.credentials.create. */
export async function startPasskeyRegistration(userId: string, username: string) {
  const existing = await db.passkey.findMany({
    where: { userId },
    select: { credentialId: true },
  })
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: Buffer.from(userId),
    userName: username,
    userDisplayName: username,
    attestationType: 'none',
    excludeCredentials: existing.map((p) => ({ id: p.credentialId, type: 'public-key' as const })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  })
  return options
}

/** Finish passkey registration — verifies the browser's credential response and stores it. */
export async function finishPasskeyRegistration(
  userId: string,
  credential: any,
  expectedChallenge: string,
  deviceName?: string,
): Promise<{ ok: boolean; error?: string }> {
  const origin = getOrigin()
  let verification: VerifiedRegistrationResponse
  try {
    verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: RP_ID,
    })
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Verification failed' }
  }
  const { registrationInfo } = verification
  if (!registrationInfo) return { ok: false, error: 'No registration info' }

  await db.passkey.create({
    data: {
      userId,
      credentialId: registrationInfo.credentialID,
      publicKey: Buffer.from(registrationInfo.credentialPublicKey).toString('base64'),
      counter: registrationInfo.credentialCounter,
      deviceType: registrationInfo.credentialDeviceType,
      transports: registrationInfo.credentialDeviceType,
      name: deviceName || `Passkey ${new Date().toLocaleDateString()}`,
    },
  })
  return { ok: true }
}

/** Start passkey login — returns options the browser feeds to navigator.credentials.get. */
export async function startPasskeyAuthentication() {
  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    userVerification: 'preferred',
  })
  return options
}

/** Finish passkey login — verifies the assertion and returns the userId to sign in. */
export async function finishPasskeyAuthentication(
  credential: any,
  expectedChallenge: string,
): Promise<{ userId?: string; ok: boolean; error?: string }> {
  const origin = getOrigin()
  // Look up the credential by ID
  const credentialId = typeof credential?.id === 'string' ? credential.id : ''
  const passkey = await db.passkey.findUnique({ where: { credentialId } })
  if (!passkey) return { ok: false, error: 'Passkey not recognized' }

  let verification: VerifiedAuthenticationResponse
  try {
    verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: RP_ID,
      authenticator: {
        credentialID: passkey.credentialId,
        credentialPublicKey: new Uint8Array(Buffer.from(passkey.publicKey, 'base64')),
        counter: passkey.counter,
        transports: passkey.transports?.split(',') as any,
      },
    })
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Verification failed' }
  }

  // Update the counter + lastUsedAt
  await db.passkey.update({
    where: { id: passkey.id },
    data: {
      counter: verification.authenticationInfo.newCounter,
      lastUsedAt: new Date(),
    },
  })
  return { ok: true, userId: passkey.userId }
}
