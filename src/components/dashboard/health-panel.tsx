'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HeartPulse,
  Loader2,
  Sparkles,
  ShieldCheck,
  Zap,
  RefreshCw,
  Activity,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { api, type BrainConsensus, type EcosystemApp } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { PostureGauge } from '@/components/cirkle/posture-gauge'
import { formatRelativeTime } from '@/lib/format'
import { CirkleMark } from '@/components/cirkle/logo'

export function HealthPanel() {
  const user = useAuthStore((s) => s.user)
  const stats = useAuthStore((s) => s.stats)
  const setDashboardTab = useAuthStore((s) => s.setDashboardTab)
  const [apps, setApps] = useState<EcosystemApp[]>([])
  const [result, setResult] = useState<BrainConsensus | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    api.getApps().then((r) => setApps(r.apps)).catch(() => {})
  }, [])

  async function analyze() {
    if (!user) return
    setPending(true)
    setResult(null)
    try {
      const authorized = apps.filter((a) => a.authorized)
      const verificationSteps = [
        user.emailVerified && 'Email ✓',
        user.phoneVerified && 'Phone ✓',
        user.kycVerified && 'KYC ✓',
        user.twoFactorEnabled && '2FA ✓',
        user.hasPasskey && 'Passkey ✓',
        user.hasRecoveryCodes && 'Recovery codes ✓',
        user.businessVerified && 'Business ✓',
      ].filter(Boolean).join(', ')

      const prompt = `You are an identity security analyst. Analyze this Cirkle identity's health:

User: @${user.username}
Verification: ${verificationSteps || 'none'}
2FA: ${user.twoFactorEnabled ? 'enabled' : 'disabled'}
Passkey: ${user.hasPasskey ? 'yes' : 'no'}
Recovery codes: ${user.hasRecoveryCodes ? 'yes' : 'no'}
PQ attestation: ${user.locked ? 'LOCKED' : 'active'}
Authorized apps: ${authorized.length} (of ${apps.length} available)
App list: ${authorized.map((a) => a.name).join(', ') || 'none'}
Sessions: ${stats?.activeSessions ?? 'unknown'}
Audit events: ${stats?.auditEvents ?? 'unknown'}
Businesses: ${stats?.businesses ?? 0}

Produce an Identity Health Score (0-100) with:
1. A single number on the first line.
2. A 2-3 sentence explanation of the score.
3. Exactly 3 actionable recommendations (prefixed with "→").
Be concise. No markdown.`

      const r = await api.askBrain(prompt)
      setResult(r)
      toast.success('AI health analysis complete')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Analysis failed')
    } finally {
      setPending(false)
    }
  }

  // Parse the AI response: first line = score, rest = explanation + recommendations
  const parsed = result ? parseHealthResponse(result.consensus) : null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <HeartPulse className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">Identity Health</h1>
          <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5 text-primary">
            <Sparkles className="h-2.5 w-2.5" /> AI-powered
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          The Circle Brain AI mesh analyzes your entire identity security state — verification, apps, risk, audit — and produces a personalized 0–100 health score with actionable recommendations. Like a credit score for your identity.
        </p>
      </div>

      {/* Analyze button */}
      <Card className="orbit-ring p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CirkleMark size={24} />
            <div>
              <h3 className="text-sm font-medium">Run AI health analysis</h3>
              <p className="text-[11px] text-muted-foreground">Queries all 5 AI providers in parallel → synthesizes a consensus</p>
            </div>
          </div>
          <Button onClick={analyze} disabled={pending} className="btn-gold gap-2 border-0">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            {pending ? 'Analyzing…' : 'Analyze my identity'}
          </Button>
        </div>
      </Card>

      {/* Result */}
      <AnimatePresence mode="wait">
        {parsed && (
          <motion.div
            key={parsed.score + parsed.explanation.slice(0, 20)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Score gauge + meta */}
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="orbit-ring relative flex flex-col items-center justify-center overflow-hidden p-6">
                <div className="aurora-bg absolute inset-0 -z-10 opacity-40" />
                <PostureGauge score={parsed.score} total={100} label="identity health" size={170} />
                <Badge variant="outline" className="mt-3 gap-1.5 border-primary/30 bg-primary/5 text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {parsed.score >= 80 ? 'Excellent' : parsed.score >= 60 ? 'Good' : parsed.score >= 40 ? 'Fair' : 'Needs attention'}
                </Badge>
              </Card>

              {/* AI explanation */}
              <Card className="orbit-ring p-5 lg:col-span-2">
                <div className="mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-medium">AI analysis</h3>
                  {result?.consensusModel && (
                    <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5 text-primary">
                      <Zap className="h-3 w-3" /> {result.consensusModel.split(' · ')[0]}
                    </Badge>
                  )}
                  <Badge variant="outline" className="ml-auto gap-1.5 border-border bg-muted/40 text-muted-foreground">
                    {result?.successCount}/{result?.totalCount} providers
                  </Badge>
                </div>
                <p className="text-pretty text-sm leading-relaxed text-foreground">{parsed.explanation}</p>
              </Card>
            </div>

            {/* Recommendations */}
            <Card className="orbit-ring p-5">
              <div className="mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-medium">Actionable recommendations</h3>
              </div>
              <ul className="space-y-2">
                {parsed.recommendations.map((rec, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-2 rounded-lg border border-border/50 bg-muted/20 p-3"
                  >
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">{i + 1}</div>
                    <span className="flex-1 text-sm">{rec}</span>
                    {getRecAction(rec) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDashboardTab(getRecAction(rec)!.tab)}
                        className="gap-1 text-xs"
                      >
                        {getRecAction(rec)!.label} <ArrowRight className="h-3 w-3" />
                      </Button>
                    )}
                  </motion.li>
                ))}
              </ul>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick stats while idle */}
      {!parsed && !pending && (
        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile icon={ShieldCheck} label="Verification steps" value={`${[user?.emailVerified, user?.phoneVerified, user?.kycVerified, user?.twoFactorEnabled, user?.hasPasskey, user?.hasRecoveryCodes, user?.businessVerified].filter(Boolean).length}/7`} />
          <StatTile icon={Activity} label="Authorized apps" value={`${apps.filter((a) => a.authorized).length}/${apps.length}`} />
          <StatTile icon={AlertTriangle} label="Risk posture" value={user?.locked ? 'LOCKED' : 'Active'} />
        </div>
      )}
    </div>
  )
}

function StatTile({ icon: Icon, label, value }: { icon: typeof ShieldCheck; label: string; value: string }) {
  return (
    <Card className="orbit-ring flex items-center gap-3 p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xl font-semibold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </Card>
  )
}

function parseHealthResponse(text: string): { score: number; explanation: string; recommendations: string[] } {
  const lines = text.trim().split('\n').filter(Boolean)
  // First line should be a number
  const scoreMatch = lines[0]?.match(/(\d+)/)
  const score = scoreMatch ? Math.min(100, parseInt(scoreMatch[1])) : 75

  // Find recommendations (lines starting with → or - or *)
  const recLines: string[] = []
  const explanationLines: string[] = []
  for (const line of lines.slice(1)) {
    if (/^[→\-*]/.test(line.trim())) {
      recLines.push(line.replace(/^[→\-*]\s*/, '').trim())
    } else if (line.trim()) {
      explanationLines.push(line.trim())
    }
  }

  return {
    score,
    explanation: explanationLines.join(' ') || text.slice(0, 300),
    recommendations: recLines.length > 0 ? recLines : ['No specific recommendations — your identity is in good shape.'],
  }
}

function getRecAction(rec: string): { tab: 'identity' | 'apps' | 'security' | 'brain'; label: string } | null {
  const r = rec.toLowerCase()
  if (r.includes('passkey')) return { tab: 'identity', label: 'Add' }
  if (r.includes('2fa') || r.includes('two-factor')) return { tab: 'identity', label: 'Enable' }
  if (r.includes('recovery')) return { tab: 'identity', label: 'Generate' }
  if (r.includes('revoke') || r.includes('app')) return { tab: 'apps', label: 'Manage' }
  if (r.includes('session')) return { tab: 'security', label: 'Review' }
  if (r.includes('kyc') || r.includes('verification')) return { tab: 'identity', label: 'Verify' }
  return null
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}
