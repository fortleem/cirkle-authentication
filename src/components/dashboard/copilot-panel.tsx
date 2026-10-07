'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain,
  Sparkles,
  Loader2,
  Send,
  CheckCircle2,
  ShieldX,
  Zap,
  TrendingDown,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { api, type EcosystemApp, type BrainConsensus } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { getAppIcon } from '@/components/cirkle/app-icons'
import { formatRelativeTime } from '@/lib/format'
import { CirkleMark } from '@/components/cirkle/logo'

export function CopilotPanel() {
  const user = useAuthStore((s) => s.user)
  const [apps, setApps] = useState<EcosystemApp[]>([])
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<BrainConsensus | null>(null)
  const [revoking, setRevoking] = useState<string | null>(null)

  useEffect(() => {
    api.getApps().then((r) => setApps(r.apps)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const authorized = apps.filter((a) => a.authorized)

  async function analyze() {
    setPending(true)
    setResult(null)
    try {
      // Construct a security-hygiene prompt from the user's authorized apps
      const appList = authorized
        .map((a) => `- ${a.name} (${a.category}, sensitivity ${a.requirements.verificationLevel}${a.requirements.twoFactorRequired ? '+2FA' : ''}): last used ${a.lastUsedAt ? formatRelativeTime(a.lastUsedAt) : 'never'}, authorized ${formatRelativeTime(a.grantedAt)}`)
        .join('\n')
      const prompt = `You are a security co-pilot for Cirkle identities. Here are my authorized apps:\n${appList}\n\nBased on staleness (apps not used recently) + sensitivity (strict/enhanced/2FA), recommend which apps I should REVOKE to reduce my attack surface. Be concise. List 2-4 recommendations as: "Revoke <app>: <one-line reason>". If everything looks fine, say so. Prioritize stale high-sensitivity apps.`
      const r = await api.askBrain(prompt)
      setResult(r)
      if (r.successCount > 0) toast.success('Co-pilot analysis complete')
      else toast.error('No providers responded')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Analysis failed')
    } finally {
      setPending(false)
    }
  }

  async function revokeApp(app: EcosystemApp) {
    setRevoking(app.id)
    try {
      await api.revokeApp(app.id)
      setApps((prev) => prev.map((a) => (a.id === app.id ? { ...a, authorized: false, grantedAt: null, lastUsedAt: null } : a)))
      toast.success(`Revoked ${app.name}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Revoke failed')
    } finally {
      setRevoking(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">AI Security Co-pilot</h1>
          <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5 text-primary">
            <Sparkles className="h-2.5 w-2.5" /> Circle Brain mesh
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          The Circle Brain AI mesh ({user && <span className="font-medium text-foreground">@{user.username}</span>}) analyzes your authorized apps for staleness + sensitivity and recommends revocations to reduce your attack surface. {authorized.length} app{authorized.length === 1 ? '' : 's'} authorized.
        </p>
      </div>

      {/* Analyze card */}
      <Card className="orbit-ring p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CirkleMark size={24} />
            <h3 className="text-sm font-medium">Ask the co-pilot</h3>
          </div>
          <Button onClick={analyze} disabled={pending || authorized.length === 0} className="btn-gold gap-2 border-0">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {pending ? 'Analyzing…' : 'Analyze my apps'}
          </Button>
        </div>
        {authorized.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">No authorized apps to analyze. Authorize an app first, then run the co-pilot.</p>
        )}
      </Card>

      {/* Co-pilot result */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key={result.consensus.slice(0, 20)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <Card className="orbit-ring relative overflow-hidden p-6">
              <div className="aurora-bg absolute inset-0 -z-10 opacity-40" />
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="font-display text-lg font-semibold">Co-pilot recommendation</h3>
                {result.consensusModel && (
                  <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5 text-primary">
                    <Zap className="h-3 w-3" /> {result.consensusModel}
                  </Badge>
                )}
                <Badge variant="outline" className="gap-1.5 border-border bg-muted/40 text-muted-foreground">
                  {result.successCount}/{result.totalCount} providers
                </Badge>
              </div>
              <div className="whitespace-pre-wrap text-pretty text-sm leading-relaxed text-foreground">
                {result.consensus}
              </div>
            </Card>

            {/* Quick-revoke grid */}
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-medium">
                <TrendingDown className="h-4 w-4 text-primary" /> Quick revoke
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {authorized.map((app) => {
                  const Icon = getAppIcon(app.icon)
                  const isStale = !app.lastUsedAt || (Date.now() - new Date(app.lastUsedAt).getTime() > 30 * 86400000)
                  return (
                    <Card key={app.id} className={`orbit-ring flex items-center gap-3 p-4 ${isStale ? 'border-amber-500/30' : ''}`}>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white" style={{ backgroundColor: app.color }}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{app.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {app.lastUsedAt ? `used ${formatRelativeTime(app.lastUsedAt)}` : 'never used'} · {formatRelativeTime(app.grantedAt)}
                        </p>
                      </div>
                      {isStale && <Badge variant="outline" className="gap-1 px-1.5 py-0 text-[10px] border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">stale</Badge>}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => revokeApp(app)}
                        disabled={revoking === app.id}
                        className="text-rose-600 hover:bg-rose-500/10 hover:text-rose-700 dark:text-rose-400"
                      >
                        {revoking === app.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldX className="h-3.5 w-3.5" />}
                      </Button>
                    </Card>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
