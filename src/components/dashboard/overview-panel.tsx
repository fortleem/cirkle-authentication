'use client'

import { useEffect, useState } from 'react'
import {
  Loader2,
  Plug,
  ShieldCheck,
  Activity,
  KeyRound,
  ArrowRight,
  Star,
  Sparkles,
  Building2,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { api, type EcosystemApp } from '@/lib/api'
import { getAppIcon } from '@/components/cirkle/app-icons'
import { useAuthStore } from '@/stores/auth-store'
import { formatRelativeTime } from '@/lib/format'
import { CirkleMark } from '@/components/cirkle/logo'

export function OverviewPanel() {
  const user = useAuthStore((s) => s.user)
  const stats = useAuthStore((s) => s.stats)
  const setDashboardTab = useAuthStore((s) => s.setDashboardTab)
  const [apps, setApps] = useState<EcosystemApp[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getApps().then((r) => setApps(r.apps)).finally(() => setLoading(false))
  }, [])

  const connectedApps = apps.filter((a) => a.authorized)
  const recommendations = apps.filter((a) => !a.authorized && (a.featured || a.slug === 'cirkle-search')).slice(0, 3)

  const securityScore = computeSecurityScore({
    twoFactor: user?.twoFactorEnabled,
    sessions: stats?.activeSessions ?? 0,
    apps: stats?.connectedApps ?? 0,
    phone: user?.phoneVerified,
    kyc: user?.kycVerified,
    business: user?.businessVerified,
  })

  // Verification completeness for the unified identity
  const verificationSteps = [
    !!user?.emailVerified,
    !!user?.phoneVerified,
    !!user?.kycVerified,
    !!user?.twoFactorEnabled,
    !!user?.businessVerified,
  ]
  const verificationDone = verificationSteps.filter(Boolean).length
  const verificationTier = verificationDone >= 5 ? 'Maximum' : verificationDone >= 3 ? 'Enhanced' : verificationDone >= 1 ? 'Basic' : 'Unverified'

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/8 via-card to-card p-6">
        <div className="cirkle-mesh absolute inset-0 -z-10 opacity-60" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 -z-10 animate-pulse-ring rounded-full bg-primary/30 blur-xl" />
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <CirkleMark size={28} className="invert" />
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Welcome back,</p>
              <h1 className="text-2xl font-semibold tracking-tight">{user?.name}</h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">@{user?.username}</span>
                {' · '}
                {user?.email}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <Badge variant="outline" className="gap-1.5 border-primary/30 bg-primary/5 text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {verificationTier} identity
            </Badge>
            <p className="text-xs text-muted-foreground">
              Last sign-in {formatRelativeTime(user?.lastLoginAt)}
            </p>
          </div>
        </div>
      </Card>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Plug}
          label="Connected apps"
          value={stats?.connectedApps ?? 0}
          accent="emerald"
          onClick={() => setDashboardTab('apps')}
        />
        <StatCard
          icon={ShieldCheck}
          label="Verification"
          value={`${verificationDone}/5`}
          accent="amber"
          onClick={() => setDashboardTab('identity')}
        />
        <StatCard
          icon={Activity}
          label="Audit events"
          value={stats?.auditEvents ?? 0}
          accent="cyan"
          onClick={() => setDashboardTab('activity')}
        />
        <StatCard
          icon={Building2}
          label="Business profiles"
          value={stats?.businesses ?? 0}
          accent="teal"
          onClick={() => setDashboardTab('business')}
        />
      </div>

      {/* Security score */}
      <Card className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Account security score</h3>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {securityScore.percent >= 80
                ? 'Excellent — your Cirkle identity is well protected.'
                : securityScore.percent >= 50
                  ? 'Good — a few steps will make you more secure.'
                  : 'Improve your security by enabling 2FA and reviewing sessions.'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-3xl font-semibold text-primary">{securityScore.percent}<span className="text-base text-muted-foreground">%</span></div>
              <p className="text-xs text-muted-foreground">{securityScore.label}</p>
            </div>
            <Progress value={securityScore.percent} className="h-2 w-24 sm:w-32" />
          </div>
        </div>
        {!user?.twoFactorEnabled && (
          <div className="mt-4 flex flex-col items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">
              <strong>Tip:</strong> Enable two-factor authentication to boost your security score.
            </p>
            <Button size="sm" variant="outline" onClick={() => setDashboardTab('security')} className="gap-1.5">
              Set up 2FA <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </Card>

      {/* Connected apps preview */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Your connected apps</h3>
          <Button variant="ghost" size="sm" onClick={() => setDashboardTab('apps')} className="gap-1.5">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
        {loading ? (
          <Card className="p-6 text-center">
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />
          </Card>
        ) : connectedApps.length === 0 ? (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">
              You haven't connected any apps yet. Authorize Cirkle-Search and other products to get started.
            </p>
            <Button size="sm" className="mt-3 gap-1.5" onClick={() => setDashboardTab('apps')}>
              Browse apps <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {connectedApps.slice(0, 6).map((app) => {
              const Icon = getAppIcon(app.icon)
              return (
                <Card key={app.id} className="flex items-center gap-3 p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white" style={{ backgroundColor: app.color }}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{app.name}</p>
                    <p className="text-xs text-muted-foreground">Connected {formatRelativeTime(app.grantedAt)}</p>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Recommended for you</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {recommendations.map((app) => {
              const Icon = getAppIcon(app.icon)
              return (
                <Card key={app.id} className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white" style={{ backgroundColor: app.color }}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-medium">{app.name}</p>
                      {app.slug === 'cirkle-search' && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{app.category}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setDashboardTab('apps')} className="gap-1.5">
                    Connect
                  </Button>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  onClick,
}: {
  icon: typeof Plug
  label: string
  value: number | string
  accent: 'emerald' | 'teal' | 'cyan' | 'amber'
  onClick?: () => void
}) {
  const accentMap = {
    emerald: 'bg-primary/10 text-primary',
    teal: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
    cyan: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  }
  return (
    <Card
      onClick={onClick}
      className="group flex cursor-pointer flex-col gap-3 p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accentMap[accent]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </Card>
  )
}

function computeSecurityScore({ twoFactor, sessions, apps, phone, kyc, business }: { twoFactor?: boolean; sessions: number; apps: number; phone?: boolean; kyc?: boolean; business?: boolean }) {
  let score = 30
  if (twoFactor) score += 25
  if (phone) score += 10
  if (kyc) score += 15
  if (business) score += 10
  if (sessions <= 2) score += 5
  if (apps > 0) score += 5
  score = Math.min(score, 100)
  return {
    percent: score,
    label: score >= 80 ? 'Strong' : score >= 50 ? 'Fair' : 'Weak',
  }
}
