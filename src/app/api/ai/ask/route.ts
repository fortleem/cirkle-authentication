import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { runConsensus } from '@/lib/ai-consensus'
import { getCurrentUser, unauthorized, getClientIp, getUserAgent, recordAudit } from '@/lib/session'

const AskSchema = z.object({
  prompt: z.string().min(2, 'Please enter a question').max(2000, 'Question is too long (max 2000 chars)'),
})

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return unauthorized('Please sign in to use Circle Brain')

  const body = await req.json().catch(() => null)
  const parsed = AskSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })
  }

  try {
    const result = await runConsensus(parsed.data.prompt, 8000)
    const ip = getClientIp(req)
    const ua = getUserAgent(req)
    await recordAudit({
      userId: user.id,
      action: 'brain.ask',
      ip,
      userAgent: ua,
      metadata: {
        promptLength: parsed.data.prompt.length,
        successCount: result.successCount,
        totalCount: result.totalCount,
        consensusModel: result.consensusModel,
      },
    })
    return NextResponse.json(result)
  } catch (e) {
    console.error('Circle Brain error', e)
    return NextResponse.json({ error: 'Circle Brain failed to reach a consensus' }, { status: 500 })
  }
}
