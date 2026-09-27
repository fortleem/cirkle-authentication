import { NextResponse } from 'next/server'
import { startPasskeyAuthentication, signChallenge } from '@/lib/passkeys'

// Public: anyone can start a passkey login (we discover the user from the credential).
export async function POST() {
  const options = await startPasskeyAuthentication()
  const challengeToken = signChallenge(options.challenge)
  return NextResponse.json({ options, challengeToken })
}
