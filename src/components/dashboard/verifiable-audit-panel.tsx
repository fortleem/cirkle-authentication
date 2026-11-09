'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link2, CheckCircle2, XCircle, Loader2, Hash, ShieldCheck, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { CirkleMark } from '@/components/cirkle/logo'

interface VerifyResult {
  total: number
  verified: number
  broken: number
  brokenAt: string[]
  rootHash: string | null
  chainIntact: boolean
}

export function VerifiableAuditPanel() {
  const user = useAuthStore((s) => s.user)
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { verify() }, [])

  async function verify() {
    setLoading(true)
    try {
      const res = await fetch('/api/audit/verify', { cache: 'no-store' })
      const data = await res.json()
      setResult(data)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">Verifiable Audit Chain</h1>
          <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5 text-primary">
            <Hash className="h-2.5 w-2.5" /> SHA-256 Merkle
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Every audit event's SHA-256 hash chains to the previous event — creating a tamper-evident, append-only log. Like Certificate Transparency for identity. The root hash is bound to your PQ attestation. Any tampering with a past event breaks the chain instantly.
        </p>
      </div>

      {/* Verification result */}
      <Card className="orbit-ring relative overflow-hidden p-6">
        <div className="aurora-bg absolute inset-0 -z-10 opacity-40" />
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Verifying chain integrity…</span>
          </div>
        ) : result ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${result.chainIntact ? 'bg-primary/10 text-primary' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                {result.chainIntact ? <CheckCircle2 className="h-7 w-7" /> : <XCircle className="h-7 w-7" />}
              </div>
              <div>
                <p className="text-lg font-semibold">{result.chainIntact ? 'Chain intact ✓' : 'Chain BROKEN'}</p>
                <p className="text-xs text-muted-foreground">
                  {result.verified}/{result.total} events verified · {result.broken} broken
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={verify} disabled={loading} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" /> Re-verify
            </Button>
          </div>
        ) : null}
      </Card>

      {/* Root hash */}
      {result?.rootHash && (
        <Card className="orbit-ring p-5">
          <div className="mb-3 flex items-center gap-2">
            <CirkleMark size={20} />
            <h3 className="text-sm font-medium">Chain root hash</h3>
            <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5 text-primary">
              <ShieldCheck className="h-2.5 w-2.5" /> PQ-bound
            </Badge>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">SHA-256 root (bound to your ML-DSA-65 PQ attestation):</p>
            <code className="mt-1 block break-all font-mono text-[10px] text-foreground/80">{result.rootHash}</code>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            This hash represents the cryptographic state of your entire audit history. It's bound to your post-quantum attestation — any change to any past event produces a different root, breaking the PQ signature.
          </p>
        </Card>
      )}

      {/* How it works */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="orbit-ring p-4">
          <Link2 className="mb-2 h-5 w-5 text-primary" />
          <p className="text-sm font-medium">Linked hashes</p>
          <p className="mt-1 text-xs text-muted-foreground">Each event's SHA-256 includes the previous event's hash. Tampering with event N breaks event N+1, N+2, …</p>
        </Card>
        <Card className="orbit-ring p-4">
          <ShieldCheck className="mb-2 h-5 w-5 text-primary" />
          <p className="text-sm font-medium">PQ-bound root</p>
          <p className="mt-1 text-xs text-muted-foreground">The chain's root hash is embedded in your ML-DSA-65 attestation — quantum-safe integrity.</p>
        </Card>
        <Card className="orbit-ring p-4">
          <Hash className="mb-2 h-5 w-5 text-primary" />
          <p className="text-sm font-medium">Instant detection</p>
          <p className="mt-1 text-xs text-muted-foreground">The verification endpoint recomputes every hash + checks the chain in one pass. Any tampering is detected instantly.</p>
        </Card>
      </div>

      {/* Stats */}
      {result && (
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Total events" value={result.total} color="text-foreground" />
          <Stat label="Verified" value={result.verified} color="text-primary" />
          <Stat label="Broken" value={result.broken} color={result.broken > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground'} />
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card className="orbit-ring p-4 text-center">
      <p className={`text-2xl font-semibold tabular-nums ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  )
}
