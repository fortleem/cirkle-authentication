'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Radar,
  ShieldAlert,
  ShieldCheck,
  Loader2,
  Activity,
  ArrowRight,
  Fingerprint,
  AlertTriangle,
  Zap,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { computeRiskScore, levelColor, levelLabel, type RiskScore, type RiskLevel } from '@/lib/risk-engine'

export function RiskRadarPanel() {
  const user = useAuthStore((s) => s.user)
  const setDashboardTab = useAuthStore((s) => s.setDashboardTab)
  const [loading, setLoading] = useState(true)
  const [recentFailures, setRecentFailures] = useState(0)
  const [knownIps, setKnownIps] = useState<string[]>([])
  const [sessionAgeMs, setSessionAgeMs] = useState(0)

  // Gather context from the audit log + sessions
  useEffect(() => {
    Promise.all([api.getAudit(), api.getSessions()])
      .then(([audit, sess]) => {
        const oneHourAgo = Date.now() - 60 * 60 * 1000
        const fails = audit.logs.filter(
          (l) => l.action.includes('login') && l.createdAt && new Date(l.createdAt).getTime() > oneHourAgo,
        ).length
        setRecentFailures(Math.max(0, fails - 1)) // discount the current successful one
        const ips = Array.from(new Set(audit.logs.map((l) => (l.ip ?? '').replace(/^::ffff:/, '')).filter(Boolean)))
        setKnownIps(ips)
        const current = sess.sessions.find((s) => s.current)
        if (current) setSessionAgeMs(Date.now() - new Date(current.createdAt).getTime())
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Compute the live risk for authorizing a strict app RIGHT NOW
  const liveRisk: RiskScore = useMemo(() => {
    if (!user) return computeRiskScore({ action: 'app.authorize', ip: '127.0.0.1', knownIps, sessionAgeMs, recentFailures, twoFactorEnabled: false, hasPasskey: false })
    return computeRiskScore({
      action: 'app.authorize',
      ip: knownIps[0] ?? '127.0.0.1',
      knownIps,
      sessionAgeMs,
      recentFailures,
      twoFactorEnabled: user.twoFactorEnabled,
      hasPasskey: user.hasPasskey,
    })
  }, [user, knownIps, sessionAgeMs, recentFailures])

  // Sample scenarios to compare
  const scenarios = useMemo(() => {
    if (!user) return []
    const base = { ip: knownIps[0] ?? '127.0.0.1', knownIps, sessionAgeMs, recentFailures, twoFactorEnabled: user.twoFactorEnabled, hasPasskey: user.hasPasskey }
    return [
      { label: 'Sign in to Circle Brain', score: computeRiskScore({ ...base, action: 'brain.ask' }) },
      { label: 'Authorize a strict app (e.g. Wedjat)', score: computeRiskScore({ ...base, action: 'app.authorize' }) },
      { label: 'Add a passkey', score: computeRiskScore({ ...base, action: 'passkey.add' }) },
      { label: 'Configure social recovery', score: computeRiskScore({ ...base, action: 'recovery.setup' }) },
      { label: 'New device, no 2FA (simulated)', score: computeRiskScore({ ...base, action: 'app.authorize', ip: '203.0.113.99', knownIps, twoFactorEnabled: false, hasPasskey: false }) },
    ]
  }, [user, knownIps, sessionAgeMs, recentFailures])

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  const color = levelColor(liveRisk.level)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Radar className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">Risk Radar</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          The Adaptive Risk Engine scores every identity action in real-time — device/IP novelty, action sensitivity, session age, recent failures, and 2FA posture combine into a 0–100 score. High risk triggers automatic step-up auth. Years ahead of any flat "verified / not verified" model.
        </p>
      </div>

      {/* Live radar */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="orbit-ring relative flex flex-col items-center justify-center overflow-hidden p-6">
          <div className="aurora-bg absolute inset-0 -z-10 opacity-40" />
          <RadarViz score={liveRisk.score} level={liveRisk.level} />
          <Badge variant="outline" className="mt-3 gap-1.5 border-border" style={{ color }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
            {levelLabel(liveRisk.level)} risk
          </Badge>
          <p className="mt-1 text-[11px] text-muted-foreground">live — authorizing a strict app right now</p>
        </Card>

        {/* Factor breakdown */}
        <Card className="orbit-ring p-5 lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium">Risk factors (live)</h3>
          </div>
          <ul className="space-y-2">
            {liveRisk.factors.map((f) => (
              <li key={f.key} className="rounded-lg border border-border/50 bg-muted/20 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{f.label}</p>
                    <p className="text-[11px] text-muted-foreground">{f.detail}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(0, Math.min(100, (f.contribution / 30) * 100))}%`,
                          backgroundColor: f.contribution > 15 ? 'hsl(var(--rose))' : f.contribution > 5 ? 'hsl(var(--gold))' : 'hsl(var(--teal))',
                        }}
                      />
                    </div>
                    <span className={`w-10 text-right text-xs font-semibold tabular-nums ${f.contribution < 0 ? 'text-primary' : 'text-foreground'}`}>
                      {f.contribution > 0 ? '+' : ''}{f.contribution}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Step-up recommendation */}
      {liveRisk.stepUpRequired ? (
        <Card className="orbit-ring border-rose-500/40 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-rose-600 dark:text-rose-400">Step-up authentication required</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                The current risk score ({liveRisk.score}/100) exceeds the step-up threshold ({liveRisk.stepUpThreshold}). Authorizing a strict app requires a fresh re-authentication. Complete more security steps to lower your baseline risk.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => setDashboardTab('identity')} className="gap-1.5">
                  <Fingerprint className="h-3.5 w-3.5" /> Add a passkey
                </Button>
                <Button size="sm" variant="outline" onClick={() => setDashboardTab('identity')} className="gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" /> Enable 2FA
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="orbit-ring border-primary/30 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">No step-up required</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Risk score {liveRisk.score}/100 is below the {liveRisk.stepUpThreshold}-point step-up threshold. You can authorize strict apps without re-authenticating.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Scenario comparison */}
      <Card className="orbit-ring p-5">
        <div className="mb-3 flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">Scenario comparison</h3>
        </div>
        <ul className="space-y-2">
          {scenarios.map((s) => {
            const c = levelColor(s.score.level)
            return (
              <li key={s.label} className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/20 p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{s.label}</p>
                </div>
                <div className="h-2 w-24 overflow-hidden rounded-full bg-muted sm:w-40">
                  <div className="h-full rounded-full" style={{ width: `${s.score.score}%`, backgroundColor: c }} />
                </div>
                <span className="w-10 text-right text-sm font-semibold tabular-nums" style={{ color: c }}>{s.score.score}</span>
                <Badge variant="outline" className="px-1.5 py-0 text-[10px]" style={{ color: c, borderColor: c }}>
                  {levelLabel(s.score.level)}
                </Badge>
              </li>
            )
          })}
        </ul>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Risk = (device novelty + action sensitivity + session age + recent failures + 2FA posture − passkey discount), capped 0–100. Threshold {liveRisk.stepUpThreshold}. Live for @{user?.username}.
      </p>
    </div>
  )
}

/** A radar/sweep SVG that fills based on the risk score. */
function RadarViz({ score, level }: { score: number; level: RiskLevel }) {
  const color = levelColor(level)
  // concentric rings + a sweep that grows with score
  const radius = 70
  return (
    <svg width="180" height="180" viewBox="0 0 180 180" fill="none">
      <defs>
        <radialGradient id="radar-grad" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={color} stopOpacity="0.35" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* concentric rings */}
      {[radius, radius * 0.7, radius * 0.4].map((r) => (
        <circle key={r} cx="90" cy="90" r={r} stroke={color} strokeOpacity="0.25" strokeWidth="1" />
      ))}
      {/* crosshair */}
      <line x1="90" y1="20" x2="90" y2="160" stroke={color} strokeOpacity="0.15" />
      <line x1="20" y1="90" x2="160" y2="90" stroke={color} strokeOpacity="0.15" />
      {/* fill arc proportional to score */}
      <motion.circle
        cx="90"
        cy="90"
        r={radius}
        fill="url(#radar-grad)"
        stroke={color}
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: score / 100 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ pathLength: score / 100 } as any}
      />
      {/* center node */}
      <circle cx="90" cy="90" r="5" fill={color} />
      <text x="90" y="100" textAnchor="middle" className="fill-foreground" style={{ fontSize: '22px', fontWeight: 600, fontFamily: 'var(--font-display), serif' }}>
        {score}
      </text>
      <text x="90" y="116" textAnchor="middle" style={{ fontSize: '8px', fill: 'hsl(var(--muted-foreground))' }}>/ 100</text>
    </svg>
  )
}
