import { Inngest } from 'inngest'

/**
 * Cirkle Authentication — Inngest client.
 * Background-job layer for audit trail distillation, welcome dispatch, and
 * cross-ecosystem sync. The event key + signing key come from env.
 */
export const inngest = new Inngest({
  id: 'cirkle-authentication',
  name: 'Cirkle Authentication',
  eventKey: process.env.INNGEST_EVENT_KEY || 'dev-local-cirkle-auth-event-key',
})

// Event names
export const EVENTS = {
  USER_REGISTERED: 'cirkle/user.registered',
  SESSION_LOGIN: 'cirkle/session.login',
  SESSION_LOGOUT: 'cirkle/session.logout',
  APP_AUTHORIZED: 'cirkle/app.authorized',
  APP_REVOKED: 'cirkle/app.revoked',
  BRAIN_ASK: 'cirkle/brain.ask',
  BUSINESS_CREATED: 'cirkle/business.created',
  TWO_FACTOR_ENABLED: 'cirkle/2fa.enabled',
} as const

/**
 * Fire-and-forget an Inngest event. Never throws / never blocks the caller —
 * background jobs are strictly best-effort alongside the main request.
 */
export function dispatchEvent(name: string, data: Record<string, unknown>) {
  try {
    void inngest.send({ name, data, ts: Date.now() }).catch(() => {})
  } catch {
    /* inngest not reachable — ignore */
  }
}
