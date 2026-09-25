import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser, unauthorized, getClientIp, getUserAgent, recordAudit } from '@/lib/session'
import { checkRequirements, type AppRequirements, type UserVerificationState } from '@/lib/requirements'
import { dispatchEvent, EVENTS } from '@/lib/inngest'

const AuthorizeSchema = z.object({
  scopes: z.string().optional(),
  businessId: z.string().optional(),
  contextType: z.enum(['personal', 'business']).optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return unauthorized('Please sign in to authorize apps')

  const { appId } = await params
  const body = await req.json().catch(() => ({}))
  const parsed = AuthorizeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid authorization request' }, { status: 400 })
  }

  const app = await db.connectedApp.findUnique({ where: { id: appId } })
  if (!app) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  }

  const requirements: AppRequirements = {
    identityType: app.identityType as AppRequirements['identityType'],
    verificationLevel: app.verificationLevel as AppRequirements['verificationLevel'],
    twoFactorRequired: app.twoFactorRequired,
    businessRequired: app.businessRequired,
    requiredScopes: app.requiredScopes,
  }
  const userState: UserVerificationState = {
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    kycVerified: user.kycVerified,
    twoFactorEnabled: user.twoFactorEnabled,
    businessVerified: user.businessVerified,
  }
  const checks = checkRequirements(requirements, userState)
  const allMet = checks.every((c) => c.met)

  // If business context is required, ensure a valid business is selected
  let businessId: string | null = null
  if (app.businessRequired || app.identityType === 'business') {
    const requestedBusinessId = parsed.data.businessId
    const business = requestedBusinessId
      ? await db.business.findFirst({ where: { id: requestedBusinessId, ownerId: user.id } })
      : await db.business.findFirst({ where: { ownerId: user.id, verified: true } })
    if (!business) {
      return NextResponse.json({
        error: 'Business profile required',
        requirements: checks,
        missingBusiness: true,
      }, { status: 422 })
    }
    businessId = business.id
  }

  if (!allMet) {
    // Requirements not met — surface the missing checks so the UI can guide the user
    return NextResponse.json({
      error: 'Requirements not met',
      requirements: checks,
      missing: checks.filter((c) => !c.met),
    }, { status: 422 })
  }

  const scopes = parsed.data.scopes || app.requiredScopes
  const contextType = businessId ? 'business' : parsed.data.contextType || 'personal'

  await db.userAppAccess.upsert({
    where: { userId_appId: { userId: user.id, appId } },
    update: { scopes, grantedAt: new Date(), contextType, businessId },
    create: { userId: user.id, appId, scopes, grantedAt: new Date(), contextType, businessId },
  })

  const ip = getClientIp(req)
  const ua = getUserAgent(req)
  await recordAudit({
    userId: user.id,
    action: 'app.authorized',
    ip,
    userAgent: ua,
    metadata: { appId, appSlug: app.slug, appName: app.name, scopes, contextType, businessId },
  })
  dispatchEvent(EVENTS.APP_AUTHORIZED, { userId: user.id, appId, appName: app.name, appSlug: app.slug, contextType, businessId })

  return NextResponse.json({
    ok: true,
    redirectUrl: app.redirectUrl
      ? `${app.redirectUrl}?cirkle_user=${encodeURIComponent(user.id)}&username=${encodeURIComponent(user.username)}&app=${app.slug}${businessId ? `&business=${businessId}` : ''}`
      : null,
    app: { id: app.id, name: app.name, slug: app.slug, homepage: app.homepage },
    contextType,
    businessId,
  })
}
