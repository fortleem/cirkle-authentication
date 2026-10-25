'use client'

import { useCBA } from '@/providers/cba-provider'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Fingerprint, Activity, ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

export function BehavioralAuthPanel() {
  const cba = useCBA()

  const statusConfig = {
    baseline: { label: 'Building baseline', color: 'text-muted-foreground', icon: Loader2, spin: true },
    matching: { label: 'Identity verified', color: 'text-primary', icon: ShieldCheck, spin: false },
    deviating: { label: 'Pattern deviation', color: 'text-amber-600 dark:text-amber-400', icon: AlertTriangle, spin: false },
    'step-up': { label: 'Step-up triggered', color: 'text-rose-600 dark:text-rose-400', icon: AlertTriangle, spin: false },
  }
  const cfg = statusConfig[cba.status]
  const Icon = cfg.icon

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">Behavioral Authentication</h1>
          <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5 text-primary">
            <Activity className="h-2.5 w-2.5" /> Continuous
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Your interaction pattern — mouse velocity, click rhythm, scroll behavior — IS your authentication. CBA passively verifies your identity in real-time. If the pattern deviates (session hijack), step-up auth triggers automatically. No competitor does this.
        </p>
      </div>

      {/* Status */}
      <Card className="orbit-ring relative overflow-hidden p-6">
        <div className="aurora-bg absolute inset-0 -z-10 opacity-40" />
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-4">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ${cfg.color}`}>
              <Icon className={`h-7 w-7 ${cfg.spin ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <p className="text-lg font-semibold">{cfg.label}</p>
              <p className="text-xs text-muted-foreground">
                {cba.status === 'baseline'
                  ? `Learning your pattern… ${Math.round(cba.baselineProgress * 100)}%`
                  : `Deviation score: ${cba.deviation.toFixed(1)} / ${3.0} threshold`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-display font-semibold tabular-nums">{cba.deviation.toFixed(1)}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">deviation score</p>
          </div>
        </div>

        {/* Progress bar (baseline) */}
        {cba.status === 'baseline' && (
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${cba.baselineProgress * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        )}
      </Card>

      {/* Deviation graph (sparkline) */}
      <Card className="orbit-ring p-5">
        <div className="mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">Live deviation history</h3>
          <Badge variant="secondary" className="ml-auto">{cba.windowCount} windows</Badge>
        </div>
        <div className="flex h-32 items-end gap-1">
          {cba.history.length === 0 ? (
            <p className="m-auto text-sm text-muted-foreground">Collecting data…</p>
          ) : (
            cba.history.map((score, i) => {
              const height = Math.min(100, (score / 6) * 100)
              const isHigh = score > 3.0
              return (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ duration: 0.3 }}
                  className={`flex-1 rounded-t-sm ${isHigh ? 'bg-rose-500' : score > 1.5 ? 'bg-amber-500' : 'bg-primary'}`}
                  style={{ minHeight: '4px' }}
                  title={`Window ${i}: ${score.toFixed(2)}`}
                />
              )
            })
          )}
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>0 (perfect match)</span>
          <span className="text-rose-500">3.0 (threshold)</span>
          <span>6.0 (high deviation)</span>
        </div>
      </Card>

      {/* Feature breakdown */}
      {cba.features && (
        <Card className="orbit-ring p-5">
          <div className="mb-3 flex items-center gap-2">
            <Fingerprint className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium">Current behavioral features</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <FeatureTile label="Mouse velocity" value={`${cba.features.mouseVelocity.toFixed(2)} px/ms`} />
            <FeatureTile label="Velocity variance" value={cba.features.mouseVariance.toFixed(3)} />
            <FeatureTile label="Click rate" value={`${cba.features.clickRate.toFixed(2)} cps`} />
            <FeatureTile label="Scroll velocity" value={cba.features.scrollVelocity.toFixed(0)} />
            <FeatureTile label="Direction changes" value={cba.features.directionChanges.toString()} />
            <FeatureTile label="Idle ratio" value={`${(cba.features.idleRatio * 100).toFixed(0)}%`} />
          </div>
        </Card>
      )}

      {/* Privacy note */}
      <Card className="orbit-ring p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <h3 className="text-sm font-medium">Privacy-preserving</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              All behavioral data (mouse positions, click timestamps, scroll deltas) stays in your browser. Only the deviation SCORE is computed locally — no raw interaction data is ever sent to the server. The server only knows "this session's pattern matches the baseline" or "it doesn't."
            </p>
          </div>
        </div>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        CBA uses Welford's online algorithm for incremental mean + variance computation, then a z-score sum for deviation. 6 features × 5s windows × 10-window baseline. No competitor ships continuous behavioral authentication.
      </p>
    </div>
  )
}

function FeatureTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium tabular-nums">{value}</p>
    </div>
  )
}
