'use client'

import { useEffect, useState } from 'react'
import { Loader2, Activity, ShieldCheck, LogIn, LogOut, Plug, Unplug, KeyRound, User as UserIcon, Phone, BadgeCheck, Building2, FileText, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api, type AuditEntry } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { formatRelativeTime, formatDateTime, formatActionLabel, parseUserAgent } from '@/lib/format'

const ACTION_ICONS: Record<string, typeof LogIn> = {
  'user.registered': UserIcon,
  'session.login': LogIn,
  'session.logout': LogOut,
  'app.authorized': Plug,
  'app.revoked': Unplug,
  '2fa.enabled': ShieldCheck,
  '2fa.disabled': ShieldCheck,
  'phone.verified': Phone,
  'kyc.started': FileText,
  'kyc.completed': BadgeCheck,
  'business.created': Building2,
  'business.updated': Building2,
  'business.verified': BadgeCheck,
  'business.deleted': Building2,
  'brain.ask': Sparkles,
}

const ACTION_COLORS: Record<string, string> = {
  'session.login': 'bg-primary/10 text-primary',
  'session.logout': 'bg-muted text-muted-foreground',
  'user.registered': 'bg-primary/10 text-primary',
  'app.authorized': 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  'app.revoked': 'bg-destructive/10 text-destructive',
  '2fa.enabled': 'bg-primary/10 text-primary',
  '2fa.disabled': 'bg-destructive/10 text-destructive',
  'phone.verified': 'bg-primary/10 text-primary',
  'kyc.started': 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  'kyc.completed': 'bg-primary/10 text-primary',
  'business.created': 'bg-primary/10 text-primary',
  'business.updated': 'bg-muted text-muted-foreground',
  'business.verified': 'bg-primary/10 text-primary',
  'business.deleted': 'bg-destructive/10 text-destructive',
  'brain.ask': 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
}

export function ActivityPanel() {
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    api.getAudit().then((r) => setLogs(r.logs)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Activity & audit log</h1>
        <p className="text-sm text-muted-foreground">
          Every sign-in, authorization, and security event on your Cirkle identity.
        </p>
      </div>

      <Card className="p-0">
        <div className="flex items-center gap-2 border-b border-border/60 px-6 py-4">
          <Activity className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Recent events</h3>
          <Badge variant="secondary" className="ml-auto">{logs.length}</Badge>
        </div>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : logs.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <ol className="divide-y divide-border/60">
            {logs.map((log) => {
              const Icon = ACTION_ICONS[log.action] ?? Activity
              const color = ACTION_COLORS[log.action] ?? 'bg-muted text-muted-foreground'
              const meta = parseUserAgent(log.userAgent)
              const appName = getMetaField(log.metadata, 'appName')
              return (
                <li key={log.id} className="flex items-start gap-4 px-6 py-4">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{formatActionLabel(log.action)}</p>
                      {appName && (
                        <Badge variant="outline" className="px-1.5 py-0 text-[10px]">{appName}</Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {meta.browser} · {meta.os}
                      {log.ip && log.ip !== 'unknown' ? ` · ${log.ip}` : ''}
                    </p>
                  </div>
                  <div className="shrink-0 text-right text-xs text-muted-foreground">
                    <p>{formatRelativeTime(log.createdAt)}</p>
                    <p className="mt-0.5 hidden sm:block">{formatDateTime(log.createdAt)}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </Card>

      {user && (
        <p className="text-center text-xs text-muted-foreground">
          Audit trail is scoped to your account: <strong className="text-foreground">{user.email}</strong>
        </p>
      )}
    </div>
  )
}

function getMetaField(meta: unknown, field: string): string | undefined {
  if (meta && typeof meta === 'object' && !Array.isArray(meta)) {
    const v = (meta as Record<string, unknown>)[field]
    if (typeof v === 'string') return v
  }
  return undefined
}
