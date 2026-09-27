'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Orbit, Sparkles, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { api, type EcosystemApp } from '@/lib/api'
import { IdentityDNA } from '@/components/cirkle/identity-dna'
import { useAuthStore } from '@/stores/auth-store'

export function ConstellationPanel() {
  const user = useAuthStore((s) => s.user)
  const setDashboardTab = useAuthStore((s) => s.setDashboardTab)
  const [apps, setApps] = useState<EcosystemApp[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getApps().then((r) => setApps(r.apps)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const authorized = apps.filter((a) => a.authorized)
  const available = apps.filter((a) => !a.authorized)

  // Distribute apps across 3 orbital rings
  const rings = useMemo(() => {
    const all = [...authorized, ...available]
    const ringDefs = [
      { r: 95, speed: 60, dir: 1, capacity: 6 },
      { r: 140, speed: 90, dir: -1, capacity: 6 },
      { r: 185, speed: 130, dir: 1, capacity: 6 },
    ]
    const result = ringDefs.map((rd) => ({ ...rd, apps: [] as EcosystemApp[] }))
    all.forEach((app, i) => {
      const ringIdx = i % 3
      if (result[ringIdx].apps.length < result[ringIdx].capacity) {
        result[ringIdx].apps.push(app)
      } else {
        // overflow → next ring with space
        const free = result.findIndex((r) => r.apps.length < r.capacity)
        if (free >= 0) result[free].apps.push(app)
      }
    })
    return result
  }, [apps])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Orbit className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">Identity Constellation</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Your Cirkle identity {user && <span className="font-medium text-foreground">@{user.username}</span>} at the center — every connected app orbits it. Arcs show live authorization strength.
        </p>
      </div>

      {/* The flagship visualization */}
      <Card className="orbit-ring relative overflow-hidden p-2 sm:p-4">
        <div className="aurora-bg absolute inset-0 -z-10 opacity-40" />
        {loading ? (
          <div className="flex h-[420px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <ConstellationCanvas rings={rings} onAppClick={() => setDashboardTab('apps')} />
        )}
      </Card>

      {/* Legend + stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Connected apps" value={authorized.length} tone="primary" onClick={() => setDashboardTab('apps')} />
        <StatCard label="Available to authorize" value={available.length} tone="gold" onClick={() => setDashboardTab('apps')} />
        <StatCard label="Ecosystem total" value={apps.length} tone="rose" onClick={() => setDashboardTab('apps')} />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border/50 bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-primary" /> Connected</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border border-dashed border-muted-foreground/50" /> Available</span>
        <span className="flex items-center gap-1.5"><Sparkles className="h-3 w-3 text-primary" /> Arcs = authorization strength</span>
        <Button size="sm" variant="outline" onClick={() => setDashboardTab('apps')} className="ml-auto gap-1.5">
          Manage authorizations <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

function ConstellationCanvas({ rings, onAppClick }: { rings: { r: number; speed: number; dir: number; capacity: number; apps: EcosystemApp[] }[]; onAppClick: () => void }) {
  const center = 250
  const vb = 500

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[560px]">
      <svg viewBox={`0 0 ${vb} ${vb}`} className="h-full w-full" fill="none">
        <defs>
          <radialGradient id="const-core" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="hsl(var(--gold) / 0.4)" />
            <stop offset="1" stopColor="hsl(var(--teal) / 0)" />
          </radialGradient>
          <linearGradient id="const-arc" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="hsl(var(--gold))" />
            <stop offset="0.5" stopColor="hsl(var(--rose))" />
            <stop offset="1" stopColor="hsl(var(--teal))" />
          </linearGradient>
        </defs>

        {/* Core glow */}
        <circle cx={center} cy={center} r="60" fill="url(#const-core)" />

        {/* Orbital ring traces */}
        {rings.map((ring, ri) => (
          <circle
            key={`trace-${ri}`}
            cx={center}
            cy={center}
            r={ring.r}
            stroke="hsl(var(--gold) / 0.12)"
            strokeWidth="0.6"
            strokeDasharray="2 4"
          />
        ))}

        {/* Connection arcs from core to each authorized app */}
        {rings.map((ring, ri) =>
          ring.apps.filter((a) => a.authorized).map((app, ai) => {
            const angle = (ai / ring.apps.length) * Math.PI * 2
            const x = center + Math.cos(angle) * ring.r
            const y = center + Math.sin(angle) * ring.r
            const strength = app.lastUsedAt ? 0.6 : 0.35
            return (
              <line
                key={`arc-${ri}-${app.id}`}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="url(#const-arc)"
                strokeWidth={1.5 + strength * 2}
                opacity={0.5 + strength * 0.4}
              />
            )
          }),
        )}

        {/* Rotating app nodes per ring */}
        {rings.map((ring, ri) => (
          <g
            key={`ring-${ri}`}
            className="cirkle-constellation-spin"
            style={{
              transformOrigin: `${center}px ${center}px`,
              animationDuration: `${ring.speed}s`,
              animationDirection: ring.dir > 0 ? 'normal' : 'reverse',
            }}
          >
            {ring.apps.map((app, ai) => {
              const angle = (ai / ring.apps.length) * Math.PI * 2
              const x = center + Math.cos(angle) * ring.r
              const y = center + Math.sin(angle) * ring.r
              return (
                <AppNode key={app.id} app={app} x={x} y={y} onClick={onAppClick} />
              )
            })}
          </g>
        ))}
      </svg>

      {/* Center identity core (HTML overlay for crisp DNA + label) */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-1 text-center">
          <div className="orbit-ring rounded-full p-1">
            <IdentityDNA seed={useAuthStore.getState()?.user?.username ?? 'cirkle'} size={56} />
          </div>
          <div className="font-display text-sm font-semibold text-foreground">@{useAuthStore.getState()?.user?.username ?? 'cirkle'}</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Identity core</div>
        </div>
      </div>
    </div>
  )
}

function AppNode({ app, x, y, onClick }: { app: EcosystemApp; x: number; y: number; onClick: () => void }) {
  const initial = (app.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 1) || 'C').toUpperCase()
  // Counter-rotate the node so the label stays upright as the ring spins
  return (
    <g transform={`translate(${x},${y})`} onClick={onClick} className="cursor-pointer">
      {app.authorized ? (
        <>
          <circle r="15" fill={app.color} opacity="0.96" />
          <circle r="15" stroke="hsl(var(--cream) / 0.55)" strokeWidth="1.2" fill="none" />
          <text textAnchor="middle" dy="4.5" fill="#fff" style={{ fontSize: '12px', fontWeight: 600, fontFamily: 'var(--font-display), serif' }}>
            {initial}
          </text>
        </>
      ) : (
        <>
          <circle r="12" fill="hsl(var(--muted) / 0.5)" stroke="hsl(var(--muted-foreground) / 0.4)" strokeWidth="1" strokeDasharray="2 2" />
          <text textAnchor="middle" dy="4" fill="hsl(var(--muted-foreground))" style={{ fontSize: '10px', fontFamily: 'var(--font-display), serif' }}>
            {initial}
          </text>
        </>
      )}
      <text
        y="26"
        textAnchor="middle"
        fill="hsl(var(--muted-foreground))"
        style={{ fontSize: '8px', fontFamily: 'var(--font-inter), sans-serif' }}
      >
        {app.name.length > 12 ? app.name.slice(0, 11) + '…' : app.name}
      </text>
    </g>
  )
}

function StatCard({ label, value, tone, onClick }: { label: string; value: number; tone: 'primary' | 'gold' | 'rose'; onClick: () => void }) {
  const tones = {
    primary: 'bg-primary/10 text-primary',
    gold: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  }
  return (
    <Card onClick={onClick} className="orbit-ring flex cursor-pointer items-center gap-3 p-4 transition-all hover:-translate-y-0.5">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`}>
        <Orbit className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xl font-semibold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </Card>
  )
}
