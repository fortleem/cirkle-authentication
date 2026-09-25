import { NextResponse } from 'next/server'
import { probeProviders } from '@/lib/ai-consensus'
import { getCurrentUser, unauthorized } from '@/lib/session'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return unauthorized('Please sign in')

  const results = await probeProviders()
  return NextResponse.json({
    providers: results.map((r) => ({
      id: r.id,
      name: r.name,
      model: r.model,
      color: r.color,
      ok: r.ok,
      error: r.error,
      latencyMs: r.latencyMs,
    })),
  })
}
