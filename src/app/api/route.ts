import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api — public API index & liveness probe.
 * Reports service status, database connectivity, and the API surface.
 * Intentionally leaks no user data; used by uptime monitors and the
 * "Database" dashboard tab as a dependency health check.
 */
export async function GET() {
  const startedAt = Date.now()
  let dbOk = false
  let dbError: string | null = null
  try {
    await db.$queryRawUnsafe('SELECT 1')
    dbOk = true
  } catch (e) {
    dbError = e instanceof Error ? e.message : 'Database unreachable'
  }

  return NextResponse.json(
    {
      ok: dbOk,
      service: 'Cirkle Authentication',
      version: '1.1.0',
      status: dbOk ? 'healthy' : 'degraded',
      checks: {
        api: 'up',
        database: dbOk ? 'up' : 'down',
      },
      latencyMs: Date.now() - startedAt,
      dbError: dbOk ? undefined : dbError,
      surface: {
        auth: ['/api/auth/register', '/api/auth/login', '/api/auth/logout', '/api/auth/me', '/api/auth/step-up'],
        apps: ['/api/apps', '/api/apps/[appId]/authorize', '/api/apps/[appId]/revoke'],
        sessions: ['/api/sessions', '/api/sessions/[id]'],
        security: ['/api/2fa', '/api/passkey', '/api/recovery-codes', '/api/recovery', '/api/pq', '/api/emergency'],
        verification: ['/api/verification/phone', '/api/verification/kyc'],
        credentials: ['/api/credentials/issue', '/api/credentials/[id]/verify'],
        intelligence: ['/api/ai/ask', '/api/ai/health'],
        compliance: ['/api/audit', '/api/audit/verify'],
        businesses: ['/api/businesses', '/api/businesses/[id]'],
        ops: ['/api/stats', '/api/database/export', '/api/api-keys', '/api/inngest', '/api/onboarding/complete'],
      },
      docs: 'https://github.com/fortleem/cirkle-authentication',
    },
    { status: dbOk ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
  )
}
