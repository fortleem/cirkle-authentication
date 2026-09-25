import bcrypt from 'bcryptjs'
import jwt, { type JwtPayload } from 'jsonwebtoken'
import { randomUUID } from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET || 'cirkle-auth-dev-secret-change-in-production-2025'
const SESSION_DURATION_DAYS = 30

export interface SessionToken {
  userId: string
  email: string
  name: string
  role: string
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12)
  return bcrypt.hash(password, salt)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function createSessionToken(payload: SessionToken): string {
  // jti (JWT ID) makes every issued token unique even when the payload and
  // issuance second are identical (e.g. register + immediate login).
  return jwt.sign({ ...payload, jti: randomUUID() }, JWT_SECRET, {
    expiresIn: `${SESSION_DURATION_DAYS}d`,
    issuer: 'cirkle-authentication',
    audience: 'cirkle-ecosystem',
  })
}

export function verifySessionToken(token: string): SessionToken | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'cirkle-authentication',
      audience: 'cirkle-ecosystem',
    }) as JwtPayload & SessionToken
    return {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    }
  } catch {
    return null
  }
}

export function getSessionExpiry(): Date {
  return new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000)
}

export { SESSION_DURATION_DAYS }
