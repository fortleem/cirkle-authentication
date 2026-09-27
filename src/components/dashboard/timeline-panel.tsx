'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  LogIn,
  LogOut,
  UserIcon,
  ShieldCheck,
  Fingerprint,
  KeyRound,
  Building2,
  Plug,
  Unplug,
  Brain,
  IdCard,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api, type AuditEntry } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { formatRelativeTime, formatDateTime, parseUserAgent, formatActionLabel } from '@/lib/format'

const ICONS: Record<string, typeof LogIn> = {
  'user.registered': UserIcon,
  'user.welcomed': UserIcon,
  'session.login': LogIn,
  'session.logout': LogOut,
  'app.authorized': Plug,
  'app.authorized.distilled': Plug,
  'app.revoked': Unplug,
  '2fa.enabled': ShieldCheck,
  '2fa.disabled': ShieldCheck,
  'passkey.added': Fingerprint,
  'passkey.removed': Fingerprint,
  'recovery-codes.generated': KeyRound,
  'recovery-code.used': KeyRound,
  'business.created': Building2,
  'business.verified': Building2,
  'business.updated': Building2,
  'business.deleted': Building2,
  'brain.ask': Brain,
  'brain.ask.distilled': Brain,
  'kyc.started': IdCard,
  'kyc.completed': IdCard,
  'phone.verified': ShieldCheck,
  'onboarding.completed': Sparkles,
}

const COLORS: Record<string, string> = {
  'user.registered': 'bg-primary/10 text-primary',
  'session.login': 'bg-primary/10 text-primary',
  'session.logout': 'bg-muted text-muted-foreground',
  'app.authorized': 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  'app.revoked': 'bg-destructive/10 text-destructive',
  '2fa.enabled': 'bg-primary/10 text-primary',
  'passkey.added': 'bg-primary/10 text-primary',
  'passkey.removed': 'bg-destructive/10 text-destructive',
  'recovery-codes.generated': 'bg-primary/10 text-primary',
  'recovery-code.used': 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  'business.created': 'bg-primary/10 text-primary',
  'business.verified': 'bg-primary/10 text-primary',
  'brain.ask': 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  'kyc.completed': 'bg-primary/10 text-primary',
  'onboarding.completed': 'bg-primary/10 text-primary',
}

export function TimelinePanel() {
  const user = useAuthStore((s) => s.user)
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getAudit().then((r) => setLogs(r.logs)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  // Group logs into milestones (keep chronological, newest first)
  const milestones = useMemo(() => logs.slice(0, 40), [logs])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">Identity Timeline</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          The animated journey of your Cirkle identity {user && <span className="font-medium text-foreground">@{user.username}</span>} — every milestone, from creation to today.
        </p>
      </div>

      {/* Summary band */}
      <Card className="orbit-ring relative overflow-hidden p-5">
        <div className="aurora-bg absolute inset-0 -z-10 opacity-40" />
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="text-3xl font-display font-semibold tabular-nums">{logs.length}</p>
            <p className="text-xs text-muted-foreground">milestones recorded</p>
          </div>
          <div className="h-10 w-px bg-border/60" />
          <div>
            <p className="text-3xl font-display font-semibold tabular-nums">{logs.filter((l) => l.action === 'session.login').length}</p>
            <p className="text-xs text-muted-foreground">sign-ins</p>
          </div>
          <div className="h-10 w-px bg-border/60" />
          <div>
            <p className="text-3xl font-display font-semibold tabular-nums">{logs.filter((l) => l.action.startsWith('app.')).length}</p>
            <p className="text-xs text-muted-foreground">app authorizations</p>
          </div>
          <div className="ml-auto text-xs text-muted-foreground">
            Member since {user && formatRelativeTime(user.createdAt)}
          </div>
        </div>
      </Card>

      {/* The timeline */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : milestones.length === 0 ? (
        <Card className="orbit-ring p-10 text-center">
          <p className="text-sm text-muted-foreground">No milestones yet. Start authorizing apps or completing security steps to build your journey.</p>
        </Card>
      ) : (
        <ol className="relative">
          {/* Vertical gradient spine */}
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-primary via-primary/40 to-transparent" />
          {milestones.map((m, i) => (
            <TimelineNode key={m.id} entry={m} index={i} />
          ))}
        </ol>
      )}
    </div>
  )
}

function TimelineNode({ entry, index }: { entry: AuditEntry; index: number }) {
  const Icon = ICONS[entry.action] ?? Sparkles
  const color = COLORS[entry.action] ?? 'bg-muted text-muted-foreground'
  const meta = parseUserAgent(entry.userAgent)
  const appName = getMetaField(entry.metadata, 'appName')
  const username = getMetaField(entry.metadata, 'username')
  const isMilestone = ['user.registered', 'passkey.added', 'recovery-codes.generated', '2fa.enabled', 'kyc.completed', 'business.verified', 'onboarding.completed'].includes(entry.action)

  return (
    <motion.li
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.6) }}
      className="relative mb-3 pl-10"
    >
      {/* Node */}
      <div className={`absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background ${color} ${isMilestone ? 'ring-2 ring-primary/30' : ''}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      {/* Content */}
      <Card className={`orbit-ring p-3.5 ${isMilestone ? 'border-primary/20' : ''}`}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-sm font-medium">{formatActionLabel(entry.action)}</p>
              {isMilestone && (
                <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5 text-primary">
                  <Sparkles className="h-2.5 w-2.5" /> milestone
                </Badge>
              )}
              {appName && <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">{appName}</Badge>}
              {username && <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-mono">@{username}</Badge>}
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {meta.browser} · {meta.os}
              {entry.ip && entry.ip !== 'unknown' && entry.ip !== '::1' ? ` · ${entry.ip}` : ''}
            </p>
          </div>
          <div className="text-right text-[11px] text-muted-foreground">
            <p className="font-medium text-foreground/80">{formatRelativeTime(entry.createdAt)}</p>
            <p className="hidden sm:block">{formatDateTime(entry.createdAt)}</p>
          </div>
        </div>
      </Card>
    </motion.li>
  )
}

function getMetaField(meta: unknown, field: string): string | undefined {
  if (meta && typeof meta === 'object' && !Array.isArray(meta)) {
    const v = (meta as Record<string, unknown>)[field]
    if (typeof v === 'string') return v
  }
  return undefined
}
