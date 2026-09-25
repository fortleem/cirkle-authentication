'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  Activity,
  Zap,
  Brain,
  RefreshCw,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { api, type BrainConsensus, type BrainProviderHealth } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { CirkleMark } from '@/components/cirkle/logo'

const SUGGESTED = [
  'Is OAuth 2.0 safer than session cookies for SSO?',
  'Should I enable 2FA for a healthcare app?',
  'What is the difference between SAML and OIDC?',
  'How does a per-app consent screen improve security?',
]

export function BrainPanel() {
  const user = useAuthStore((s) => s.user)
  const [prompt, setPrompt] = useState('')
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<BrainConsensus | null>(null)
  const [health, setHealth] = useState<BrainProviderHealth[] | null>(null)
  const [healthLoading, setHealthLoading] = useState(true)

  useEffect(() => {
    refreshHealth()
  }, [])

  async function refreshHealth() {
    setHealthLoading(true)
    try {
      const r = await api.brainHealth()
      setHealth(r.providers)
    } catch {
      setHealth(null)
    } finally {
      setHealthLoading(false)
    }
  }

  async function ask(q?: string) {
    const question = (q ?? prompt).trim()
    if (question.length < 2) {
      toast.error('Please enter a question for Circle Brain')
      return
    }
    setPending(true)
    setResult(null)
    try {
      const r = await api.askBrain(question)
      setResult(r)
      if (q) setPrompt(q)
      if (r.successCount === 0) {
        toast.error('No providers responded')
      } else if (r.successCount < r.totalCount) {
        toast.info(`Consensus reached with ${r.successCount}/${r.totalCount} providers`)
      } else {
        toast.success(`Consensus reached across all ${r.totalCount} providers`)
      }
      refreshHealth()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Circle Brain failed')
    } finally {
      setPending(false)
    }
  }

  const liveCount = health?.filter((p) => p.ok).length ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">Circle Brain</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          A multi-provider AI mesh ({user && <span className="font-medium text-foreground">@{user.username}</span>}) — Groq, OpenRouter, NVIDIA, Gemini & HuggingFace answer in parallel, then a synthesizer reconciles them into one consensus.
        </p>
      </div>

      {/* Provider health strip */}
      <Card className="orbit-ring p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium">Provider mesh</h3>
            <Badge variant="outline" className="gap-1.5 border-primary/30 bg-primary/5 text-primary">
              <span className="signal-dot" data-state={liveCount > 0 ? undefined : 'off'} />
              {liveCount}/{health?.length ?? 5} live
            </Badge>
          </div>
          <Button size="sm" variant="ghost" onClick={refreshHealth} disabled={healthLoading} className="gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${healthLoading ? 'animate-spin' : ''}`} />
            Probe
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {(health ?? []).map((p) => (
            <div key={p.id} className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 px-2.5 py-2">
              <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{p.name}</p>
                <p className="truncate text-[10px] text-muted-foreground">{p.model}</p>
              </div>
              {p.ok ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
              ) : (
                <XCircle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
              )}
            </div>
          ))}
          {healthLoading && !health && (
            <p className="col-span-full text-center text-xs text-muted-foreground">Probing providers…</p>
          )}
        </div>
      </Card>

      {/* Ask form */}
      <Card className="orbit-ring p-5">
        <div className="mb-3 flex items-center gap-2">
          <CirkleMark size={20} />
          <h3 className="text-sm font-medium">Ask the mesh</h3>
        </div>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask Circle Brain anything about authentication, security, the ecosystem…"
          className="min-h-[88px] resize-y"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              ask()
            }
          }}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {SUGGESTED.map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              disabled={pending}
              className="gold-stroke text-[11px] disabled:opacity-50"
            >
              {s.length > 38 ? s.slice(0, 38) + '…' : s}
            </button>
          ))}
          <Button
            onClick={() => ask()}
            disabled={pending || prompt.trim().length < 2}
            className="btn-gold ml-auto gap-1.5 border-0"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {pending ? 'Reaching consensus…' : 'Ask'}
          </Button>
        </div>
      </Card>

      {/* Consensus result */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key={result.prompt + result.consensus.slice(0, 20)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Consensus answer */}
            <Card className="orbit-ring relative overflow-hidden p-6">
              <div className="aurora-bg absolute inset-0 -z-10 opacity-50" />
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="font-display text-lg font-semibold">Consensus</h3>
                {result.consensusModel && (
                  <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5 text-primary">
                    <Zap className="h-3 w-3" />
                    {result.consensusModel}
                  </Badge>
                )}
                <Badge variant="outline" className="gap-1.5 border-border bg-muted/40 text-muted-foreground">
                  {result.successCount}/{result.totalCount} providers
                </Badge>
                {result.agreed && result.successCount === result.totalCount && (
                  <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5 text-primary">
                    <CheckCircle2 className="h-3 w-3" /> Full agreement
                  </Badge>
                )}
              </div>
              <p className="mb-4 text-xs text-muted-foreground">
                Question: <span className="text-foreground">{result.prompt}</span>
              </p>
              <div className="whitespace-pre-wrap text-pretty text-sm leading-relaxed text-foreground">
                {result.consensus}
              </div>
            </Card>

            {/* Per-provider breakdown */}
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Activity className="h-4 w-4 text-primary" /> Provider responses
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {result.providers.map((p) => (
                  <Card
                    key={p.id}
                    className={`orbit-ring p-4 ${p.ok ? '' : 'opacity-60'}`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
                      <p className="font-medium">{p.name}</p>
                      {p.ok ? (
                        <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5 text-primary">
                          <CheckCircle2 className="h-2.5 w-2.5" /> {p.latencyMs}ms
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 border-destructive/30 bg-destructive/5 text-destructive">
                          <XCircle className="h-2.5 w-2.5" /> failed
                        </Badge>
                      )}
                      <span className="ml-auto truncate text-[10px] text-muted-foreground">{p.model}</span>
                    </div>
                    {p.ok ? (
                      <p className="line-clamp-6 text-xs text-muted-foreground">{p.answer}</p>
                    ) : (
                      <p className="text-xs text-destructive/80">{p.error}</p>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
