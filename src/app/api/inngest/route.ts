import { serve } from 'inngest/next'
import { inngest, EVENTS } from '@/lib/inngest'
import { db } from '@/lib/db'

/**
 * Inngest serves background functions for the Cirkle Authentication ecosystem.
 * Endpoint: /api/inngest (the URL Inngest calls back to trigger functions).
 */

// 1) When a user registers, distil a welcome summary (async, non-blocking).
const welcomeUser = inngest.createFunction(
  { id: 'cirkle-welcome-user', name: 'Welcome new Cirkle identity', triggers: [{ event: EVENTS.USER_REGISTERED }] },
  async ({ event, step }) => {
    const { userId, username, email } = (event?.data ?? {}) as { userId: string; username: string; email: string }
    await step.run('log-welcome', async () => {
      // In production this would dispatch an email / welcome message via Cirkle-Mail.
      try {
        await db.auditLog.create({
          data: {
            userId,
            action: 'user.welcomed',
            metadata: JSON.stringify({ username, via: 'inngest' }),
          },
        })
      } catch {
        /* best-effort */
      }
      return { welcomed: true, username }
    })
    return { ok: true }
  },
)

// 2) When an app is authorized, distil an audit summary + flag high-risk apps.
const distillAuthorization = inngest.createFunction(
  { id: 'cirkle-distill-authorization', name: 'Distill app authorization', triggers: [{ event: EVENTS.APP_AUTHORIZED }] },
  async ({ event, step }) => {
    const data = (event?.data ?? {}) as { userId: string; appName: string; appSlug: string; contextType: string }
    await step.run('distill', async () => {
      const highRisk = ['fin', 'hea', 'leg', 'mar'].some((t) =>
        (data.appSlug ?? '').toLowerCase().includes(t),
      )
      try {
        await db.auditLog.create({
          data: {
            userId: data.userId,
            action: 'app.authorized.distilled',
            metadata: JSON.stringify({ app: data.appName, contextType: data.contextType, highRisk }),
          },
        })
      } catch {
        /* best-effort */
      }
      return { distilled: true, highRisk }
    })
    return { ok: true }
  },
)

// 3) Circle Brain query → distil a knowledge note (self-learning).
const distillBrainQuery = inngest.createFunction(
  { id: 'cirkle-distill-brain-query', name: 'Distill Circle Brain query', triggers: [{ event: EVENTS.BRAIN_ASK }] },
  async ({ event, step }) => {
    const data = (event?.data ?? {}) as { userId: string; promptLength: number; successCount: number; consensusModel: string | null }
    await step.run('distill', async () => {
      try {
        await db.auditLog.create({
          data: {
            userId: data.userId,
            action: 'brain.ask.distilled',
            metadata: JSON.stringify({
              promptLength: data.promptLength,
              providers: data.successCount,
              model: data.consensusModel,
            }),
          },
        })
      } catch {
        /* best-effort */
      }
      return { distilled: true }
    })
    return { ok: true }
  },
)

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [welcomeUser, distillAuthorization, distillBrainQuery],
  signingKey: process.env.INNGEST_SIGNING_KEY,
})
