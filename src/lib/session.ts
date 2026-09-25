import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from './db'
import { verifySessionToken } from './auth'

export const SESSION_COOKIE = 'cirkle_session'

export interface AuthUser {
  id: string
  username: string
  email: string
  name: string
  role: string
  twoFactorEnabled: boolean
  emailVerified: boolean
  phoneVerified: boolean
  kycVerified: boolean
  businessVerified: boolean
  phone: string | null
  avatarUrl: string | null
  lastLoginAt: Date | null
  createdAt: Date
}

export async function setSessionCookie(token: string) {
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires,
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE)?.value
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getSessionToken()
  if (!token) return null

  const payload = verifySessionToken(token)
  if (!payload) return null

  // Validate session exists in DB
  const session = await db.session.findFirst({
    where: { token, expiresAt: { gt: new Date() } },
    select: { userId: true },
  })
  if (!session) return null

  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      role: true,
      twoFactorEnabled: true,
      emailVerified: true,
      phoneVerified: true,
      kycVerified: true,
      businessVerified: true,
      phone: true,
      avatarUrl: true,
      lastLoginAt: true,
      createdAt: true,
    },
  })
  return user
}

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  if (forwarded) return forwarded.split(',')[0].trim()
  if (realIp) return realIp
  return 'unknown'
}

export function getUserAgent(req: NextRequest): string {
  return req.headers.get('user-agent') || 'unknown'
}

export async function recordAudit(params: {
  userId?: string | null
  action: string
  ip?: string | null
  userAgent?: string | null
  metadata?: Record<string, unknown> | null
}) {
  try {
    await db.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        ip: params.ip ?? null,
        userAgent: params.userAgent ?? null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    })
  } catch (e) {
    console.error('Failed to record audit log', e)
  }
}

export function unauthorized(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 })
}

export function badRequest(message = 'Bad request', extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error: message, ...extra }, { status: 400 })
}
