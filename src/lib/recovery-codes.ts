import { randomBytes, scryptSync } from 'crypto'
import { db } from './db'

// 10 recovery codes, format XXXX-XXXX-XXXX (alphanumeric, no ambiguous chars)
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no I, O, 0, 1
const CODE_LEN = 12
const CODE_COUNT = 10

export function generateRecoveryCodes(): string[] {
  const codes: string[] = []
  for (let i = 0; i < CODE_COUNT; i++) {
    const bytes = randomBytes(CODE_LEN)
    let code = ''
    for (let j = 0; j < CODE_LEN; j++) {
      code += CODE_ALPHABET[bytes[j] % CODE_ALPHABET.length]
    }
    // format as XXXX-XXXX-XXXX
    codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}`)
  }
  return codes
}

/** Deterministic hash of a single recovery code (per-code, stored as a JSON array). */
function hashCode(code: string, salt: string): string {
  const buf = scryptSync(code.toUpperCase(), salt, 32)
  return buf.toString('hex')
}

/** Build a stored blob: salt + array of hashed codes, base64-encoded JSON. */
export function hashRecoveryCodes(codes: string[]): string {
  const salt = randomBytes(16).toString('hex')
  const hashed = codes.map((c) => hashCode(c, salt))
  return Buffer.from(JSON.stringify({ salt, hashed })).toString('base64')
}

/** Verify a code against the stored blob; returns the index of the consumed code or -1. */
function verifyCode(code: string, blob: string): number {
  try {
    const parsed = JSON.parse(Buffer.from(blob, 'base64').toString()) as { salt: string; hashed: string[] }
    const target = hashCode(code, parsed.salt)
    return parsed.hashed.indexOf(target)
  } catch {
    return -1
  }
}

/**
 * Consume a recovery code: verify + remove it from the stored blob.
 * Returns true if the code was valid and consumed.
 */
export async function consumeRecoveryCode(userId: string, code: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { recoveryCodesHash: true },
  })
  if (!user?.recoveryCodesHash) return false

  try {
    const parsed = JSON.parse(Buffer.from(user.recoveryCodesHash, 'base64').toString()) as { salt: string; hashed: string[] }
    const target = hashCode(code, parsed.salt)
    const idx = parsed.hashed.indexOf(target)
    if (idx === -1) return false
    // remove the consumed code
    parsed.hashed.splice(idx, 1)
    const newBlob = Buffer.from(JSON.stringify(parsed)).toString('base64')
    await db.user.update({
      where: { id: userId },
      data: { recoveryCodesHash: parsed.hashed.length ? newBlob : null },
    })
    return true
  } catch {
    return false
  }
}

/** Count remaining recovery codes (without exposing them). */
export function countRemainingCodes(blob: string | null): number {
  if (!blob) return 0
  try {
    const parsed = JSON.parse(Buffer.from(blob, 'base64').toString()) as { hashed: string[] }
    return parsed.hashed.length
  } catch {
    return 0
  }
}

export { verifyCode }
