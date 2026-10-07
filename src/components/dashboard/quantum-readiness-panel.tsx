'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Atom,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Cpu,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { api, type PostureScore, type PQVerifyResult } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { PostureGauge } from '@/components/cirkle/posture-gauge'
import { CRYPTO_PRIMITIVES, statusLabel, statusColor } from '@/lib/quantum-readiness'
import { formatRelativeTime } from '@/lib/format'

export function QuantumReadinessPanel() {
  const user = useAuthStore((s) => s.user)
  const [verify, setVerify] = useState<PQVerifyResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [attesting, setAttesting] = useState(false)

  useEffect(() => { refresh() }, [])

  async function refresh() {
    setLoading(true)
    try {
      const r = await api.pqVerify()
      setVerify(r)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  async function attest() {
    setAttesting(true)
    try {
      const r = await api.pqAttest()
      toast.success('Post-quantum attestation issued (ML-DSA-65 / FIPS 204)')
      await refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Attestation failed')
    } finally { setAttesting(false) }
  }

  const posture = verify?.posture ?? null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Atom className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">Quantum Readiness</h1>
          <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5 text-primary">
            <Sparkles className="h-2.5 w-2.5" /> ML-DSA-65 · FIPS 204
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Cirkle Authentication is quantum-ready. Every cryptographic primitive is audited against Shor's + Grover's algorithms, and each identity can be bound to a post-quantum ML-DSA-65 (CRYSTALS-Dilithium) lattice keypair — resistant to attacks that break RSA, ECDSA, and the passkey's ECDSA.
        </p>
      </div>

      {/* Posture gauge + summary */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="orbit-ring relative flex flex-col items-center justify-center overflow-hidden p-6">
          <div className="aurora-bg absolute inset-0 -z-10 opacity-40" />
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : posture ? (
            <>
              <PostureGauge score={posture.score} total={100} label="quantum-ready" size={170} />
              <Badge variant="outline" className="mt-3 gap-1.5 border-primary/30 bg-primary/5 text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {posture.level}
              </Badge>
            </>
          ) : null}
        </Card>

        <Card className="orbit-ring p-5 lg:col-span-2">
          <h3 className="mb-3 text-sm font-medium">Quantum exposure summary</h3>
          {posture ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Q-SAFE primitives" value={posture.safeCount} tone="safe" />
              <Stat label="Hybrid (transitional)" value={posture.hybridCount} tone="hybrid" />
              <Stat label="Q-VULN primitives" value={posture.vulnerableCount} tone="vulnerable" />
              <Stat label="Total primitives" value={posture.total} tone="neutral" />
            </div>
          ) : null}
          <p className="mt-3 text-xs text-muted-foreground">
            Posture score weights Q-SAFE = 1, HYBRID = 0.5, Q-VULN = 0. The single Q-VULN primitive (WebAuthn ECDSA) is mitigated by the parallel ML-DSA-65 attestation layer.
          </p>
        </Card>
      </div>

      {/* Post-quantum attestation */}
      <Card className="orbit-ring p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium">Post-quantum attestation (ML-DSA-65)</h3>
          </div>
          <Button size="sm" onClick={attest} disabled={attesting} className="btn-gold gap-1.5 border-0">
            {attesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
            {attesting ? 'Signing…' : verify?.hasAttestation ? 'Re-issue attestation' : 'Issue PQ attestation'}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
        ) : verify?.hasAttestation ? (
          <div className="space-y-3">
            <div className={`flex items-start gap-3 rounded-lg p-3 ${verify.valid ? 'border border-primary/30 bg-primary/5' : 'border border-rose-500/30 bg-rose-500/5'}`}>
              {verify.valid ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" /> : <ShieldAlert className="mt-0.5 h-4 w-4 text-rose-600 dark:text-rose-400" />}
              <div>
                <p className="text-sm font-medium">{verify.valid ? 'Lattice signature verified ✓' : 'Attestation signature INVALID'}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  ML-DSA-65 (FIPS 204, NIST level 3, 192-bit). Issued {formatRelativeTime(verify.createdAt)} for @{user?.username}. Bound to your identity + current posture.
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/20 p-3 font-mono text-[10px] text-muted-foreground">
              <div className="mb-1 font-sans text-[10px] uppercase tracking-wide">Public key (base64, {Math.round(((verify.publicKey ?? '').length * 6) / 8)} bytes):</div>
              <div className="break-all line-clamp-3">{verify.publicKey}</div>
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
              <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Signed binding message:</div>
              <pre className="whitespace-pre-wrap break-all font-mono text-[10px] text-foreground/80">{verify.message}</pre>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border/60 p-4 text-center">
            <Cpu className="mx-auto h-5 w-5 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">No PQ attestation yet.</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Issue one to bind your identity to a post-quantum lattice keypair — a parallel PQ signature that survives even if RSA/ECDSA fall to a quantum computer.</p>
          </div>
        )}
      </Card>

      {/* Primitive audit table */}
      <Card className="orbit-ring p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium">Cryptographic primitive audit</h3>
          </div>
          <Button size="sm" variant="ghost" onClick={refresh} disabled={loading} className="gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
        <ul className="space-y-2">
          {CRYPTO_PRIMITIVES.map((p, i) => (
            <motion.li
              key={p.id}
              initial={{ opacity: 0, y: 4 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
              className="rounded-lg border border-border/50 bg-muted/20 p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={`gap-1 px-1.5 py-0 text-[10px] ${statusColor(p.status)}`}>
                  {statusLabel(p.status)}
                </Badge>
                <span className="font-medium">{p.name}</span>
                <span className="text-[11px] text-muted-foreground">— {p.usedIn}</span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                <span className="font-medium text-foreground/80">Threat:</span> {p.threat}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{p.detail}</p>
              {p.status !== 'safe' && (
                <p className="mt-1.5 flex items-start gap-1.5 text-xs">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span><strong className="text-amber-700 dark:text-amber-300">Mitigation:</strong> {p.mitigation}</span>
                </p>
              )}
            </motion.li>
          ))}
        </ul>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Quantum-readiness aligns with NIST FIPS 204 (ML-DSA) + CNSA 2.0 migration guidance. The ML-DSA-65 attestation is a real, verified lattice signature — your identity is bound to a post-quantum keypair today.
      </p>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone: 'safe' | 'hybrid' | 'vulnerable' | 'neutral' }) {
  const tones: Record<string, string> = {
    safe: 'text-primary',
    hybrid: 'text-amber-600 dark:text-amber-400',
    vulnerable: 'text-rose-600 dark:text-rose-400',
    neutral: 'text-foreground',
  }
  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
      <p className={`text-2xl font-semibold tabular-nums ${tones[tone]}`}>{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  )
}
