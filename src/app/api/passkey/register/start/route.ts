import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, unauthorized } from '@/lib/session'
import { startPasskeyRegistration, signChallenge } from '@/lib/passkeys'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return unauthorized('Please sign in')

  const options = await startPasskeyRegistration(user.id, user.username)
  // Sign the challenge so the client can hold it for the finish step (stateless).
  const challengeToken = signChallenge(options.challenge, user.id)
  return NextResponse.json({ options, challengeToken })
}
