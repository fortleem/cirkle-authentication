'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Rocket,
  Search,
  CheckCircle2,
  ExternalLink,
  Plus,
  Loader2,
  Sparkles,
  Package,
  ArrowRight,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { api, type EcosystemApp } from '@/lib/api'
import { getAppIcon } from '@/components/cirkle/app-icons'
import { APP_BUNDLES, computeCombinedRequirement, type AppBundle } from '@/lib/app-bundles'
import { useAuthStore } from '@/stores/auth-store'
import { formatRelativeTime } from '@/lib/format'
import { CirkleMark } from '@/components/cirkle/logo'

export function LaunchpadPanel() {
  const user = useAuthStore((s) => s.user)
  const setDashboardTab = useAuthStore((s) => s.setDashboardTab)
  const [apps, setApps] = useState<EcosystemApp[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [bundlePending, setBundlePending] = useState<string | null>(null)

  useEffect(() => {
    api.getApps().then((r) => setApps(r.apps)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const authorized = apps.filter((a) => a.authorized)
  const available = apps.filter((a) => !a.authorized)

  const filtered = useMemo(() => {
    if (!query) return apps
    const q = query.toLowerCase()
    return apps.filter((a) =>
      a.name.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)
    )
  }, [apps, query])

  // Group apps by category for the grid
  const byCategory = useMemo(() => {
    const map = new Map<string, EcosystemApp[]>()
    for (const a of filtered) {
      if (!map.has(a.category)) map.set(a.category, [])
      map.get(a.category)!.push(a)
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [filtered])

  // For each bundle, compute how many of its apps are authorized
  const bundleStatus = useMemo(() => {
    return APP_BUNDLES.map((bundle) => {
      const bundleApps = bundle.appSlugs
        .map((slug) => apps.find((a) => a.slug === slug))
        .filter(Boolean) as EcosystemApp[]
      const authorizedCount = bundleApps.filter((a) => a.authorized).length
      const allAuthorized = authorizedCount === bundleApps.length
      return { bundle, apps: bundleApps, authorizedCount, allAuthorized }
    })
  }, [apps])

  async function authorizeBundle(bundle: AppBundle, bundleApps: EcosystemApp[]) {
    setBundlePending(bundle.id)
    let success = 0
    let fail = 0
    for (const app of bundleApps) {
      if (app.authorized) { success++; continue }
      try {
        await api.authorizeApp(app.id, { duration: 'permanent' })
        success++
        setApps((prev) => prev.map((a) => a.id === app.id ? { ...a, authorized: true, grantedAt: new Date().toISOString() } : a))
      } catch {
        fail++
      }
    }
    if (fail === 0) toast.success(`${bundle.name}: ${success} app${success === 1 ? '' : 's'} authorized`)
    else toast.warning(`${bundle.name}: ${success} authorized, ${fail} need requirements first`)
    setBundlePending(null)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">Launchpad</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Your one-tap gateway to the entire Cirkle ecosystem. One identity ({user && <span className="font-medium text-foreground">@{user.username}</span>}) reaches every app — authorize bundles in one click, open any app with your identity token. No fragmentation.
        </p>
      </div>

      {/* App Bundles — one-click multi-app authorization */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-semibold">App Bundles</h2>
          <span className="text-xs text-muted-foreground">— one-click multi-app authorization</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bundleStatus.map(({ bundle, apps: bundleApps, authorizedCount, allAuthorized }, i) => {
            const BundleIcon = getAppIcon(bundle.icon)
            return (
              <motion.div
                key={bundle.id}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.3) }}
              >
                <Card className={`orbit-ring flex h-full flex-col p-5 ${allAuthorized ? 'border-primary/30' : ''}`}>
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ backgroundColor: bundle.color }}>
                        <BundleIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{bundle.name}</h3>
                        <p className="text-[10px] text-muted-foreground">
                          {(() => {
                            const req = computeCombinedRequirement(bundleApps)
                            return (
                              <span className="flex flex-wrap gap-1">
                                {req.parts.map((p) => (
                                  <span key={p} className={`rounded-full px-1.5 py-0 text-[9px] ${
                                    p === 'KYC' ? 'border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                                    p === '2FA' ? 'border border-primary/30 bg-primary/5 text-primary' :
                                    p === 'Business' ? 'border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                                    'border border-border/50 text-muted-foreground'
                                  }`}>{p}</span>
                                ))}
                                <span className="ml-0.5 font-medium text-muted-foreground">
                                  {req.verificationLevel.charAt(0).toUpperCase() + req.verificationLevel.slice(1)}
                                  {req.twoFactorRequired && '+2FA'}
                                  {req.businessRequired && '+Biz'}
                                </span>
                              </span>
                            )
                          })()}
                        </p>
                      </div>
                    </div>
                    {allAuthorized && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="mb-3 flex-1 text-xs text-muted-foreground">{bundle.description}</p>
                  {/* App chips */}
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {bundleApps.map((app) => {
                      const Icon = getAppIcon(app.icon)
                      return (
                        <span
                          key={app.id}
                          className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] ${app.authorized ? 'border-primary/30 bg-primary/5 text-primary' : 'border-border/50 text-muted-foreground'}`}
                          title={app.name}
                        >
                          <Icon className="h-2.5 w-2.5" style={{ color: app.color }} />
                          {app.name.length > 12 ? app.name.slice(0, 11) + '…' : app.name}
                          {app.authorized && <CheckCircle2 className="h-2 w-2" />}
                        </span>
                      )
                    })}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-muted-foreground">{authorizedCount}/{bundleApps.length} connected</span>
                    {allAuthorized ? (
                      <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5 text-primary">
                        <CheckCircle2 className="h-2.5 w-2.5" /> All connected
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => authorizeBundle(bundle, bundleApps)}
                        disabled={bundlePending === bundle.id}
                        className="btn-gold gap-1.5 border-0"
                      >
                        {bundlePending === bundle.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                        {bundlePending === bundle.id ? 'Authorizing…' : 'Authorize all'}
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* App Launcher Grid — organized by category */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CirkleMark size={20} />
            <h2 className="font-display text-lg font-semibold">All Apps</h2>
            <Badge variant="secondary">{apps.length}</Badge>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search apps…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-6">
            {byCategory.map(([category, catApps]) => (
              <div key={category}>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{category}</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                  {catApps.map((app) => {
                    const Icon = getAppIcon(app.icon)
                    return (
                      <Card
                        key={app.id}
                        className={`orbit-ring group flex cursor-pointer flex-col items-center gap-2 p-4 text-center transition-all hover:-translate-y-0.5 ${app.authorized ? 'border-primary/30' : ''}`}
                        onClick={() => app.authorized ? window.open(app.redirectUrl || app.homepage, '_blank') : setDashboardTab('apps')}
                      >
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-sm transition-transform group-hover:scale-110"
                          style={{ backgroundColor: app.color }}
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="truncate text-sm font-medium">{app.name}</p>
                          {app.authorized ? (
                            <p className="text-[10px] text-primary">✓ Open</p>
                          ) : (
                            <p className="text-[10px] text-muted-foreground">Authorize</p>
                          )}
                        </div>
                        {app.authorized && (
                          <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                        )}
                      </Card>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="orbit-ring flex items-center gap-3 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xl font-semibold tabular-nums">{authorized.length}</p>
            <p className="text-xs text-muted-foreground">connected</p>
          </div>
        </Card>
        <Card className="orbit-ring flex items-center gap-3 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Plus className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xl font-semibold tabular-nums">{available.length}</p>
            <p className="text-xs text-muted-foreground">available</p>
          </div>
        </Card>
        <Card
          className="orbit-ring flex cursor-pointer items-center gap-3 p-4 transition-all hover:-translate-y-0.5"
          onClick={() => setDashboardTab('apps')}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ArrowRight className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium">Manage authorizations</p>
            <p className="text-xs text-muted-foreground">revoke, time-lock, inspect scopes</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
