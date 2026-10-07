'use client'

import { useEffect, useState } from 'react'
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Copy,
  Download,
  Sparkles,
  ShieldCheck,
  Fingerprint,
  Atom,
  Loader2,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { IdentityDNA } from '@/components/cirkle/identity-dna'
import { CirkleMark } from '@/components/cirkle/logo'
import { formatDate } from '@/lib/format'
import { api, type PQVerifyResult } from '@/lib/api'

export function IdentityCardPanel() {
  const user = useAuthStore((s) => s.user)
  const stats = useAuthStore((s) => s.stats)
  const [pq, setPq] = useState<PQVerifyResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.pqVerify().then(setPq).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (!user) return null

  const verifications = [
    { label: 'Email', met: user.emailVerified },
    { label: 'Phone', met: user.phoneVerified },
    { label: 'KYC', met: user.kycVerified },
    { label: '2FA', met: user.twoFactorEnabled },
    { label: 'Passkey', met: user.hasPasskey },
    { label: 'Recovery codes', met: user.hasRecoveryCodes },
    { label: 'Business', met: user.businessVerified },
    { label: 'PQ attestation', met: pq?.hasAttestation && pq?.valid === true },
  ]
  const completed = verifications.filter((v) => v.met).length
  const tier = completed >= 8 ? 'Maximum' : completed >= 5 ? 'Enhanced' : completed >= 2 ? 'Basic' : 'Unverified'

  function copySummary() {
    const summary = `Cirkle Identity Card
━━━━━━━━━━━━━━━━━━
@${user!.username}
${user!.name}
${user!.email}

Tier: ${tier} (${completed}/${verifications.length} verified)
${verifications.map((v) => `${v.met ? '✓' : '✗'} ${v.label}`).join('\n')}

Post-quantum: ${pq?.hasAttestation && pq?.valid ? 'ML-DSA-65 ✓' : 'Not attested'}
Member since: ${formatDate(user!.createdAt)}
━━━━━━━━━━━━━━━━━━`
    navigator.clipboard.writeText(summary).then(() => toast.success('Identity summary copied'))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">Identity Card</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Your portable Cirkle identity — a digital passport proving who you are across the ecosystem.
        </p>
      </div>

      {/* The card */}
      <div className="flex justify-center">
        <Card className="orbit-ring relative w-full max-w-md overflow-hidden p-0" style={{ aspectRatio: '1.586 / 1' }}>
          <div className="aurora-bg absolute inset-0 -z-10 opacity-30" />
          <div className="arabesque absolute inset-0 -z-10 opacity-30" />

          {/* Card header */}
          <div className="flex items-center justify-between border-b border-border/40 px-5 py-3">
            <div className="flex items-center gap-2">
              <CirkleMark size={20} />
              <span className="font-display text-sm font-semibold">Cirkle</span>
            </div>
            <span className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground">Identity Card</span>
          </div>

          {/* Card body */}
          <div className="flex gap-4 p-5">
            {/* DNA "photo" */}
            <div className="shrink-0">
              <div className="orbit-ring rounded-xl p-1">
                <IdentityDNA seed={user.username} size={72} />
              </div>
            </div>
            {/* Details */}
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
              <p className="font-display text-lg font-semibold leading-tight">{user.name}</p>
              <p className="text-sm text-primary">@{user.username}</p>
              <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
              <div className="mt-1 flex items-center gap-1.5">
                <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5 px-1.5 py-0 text-[9px] text-primary">
                  <Sparkles className="h-2 w-2" /> {tier}
                </Badge>
                {pq?.hasAttestation && pq?.valid && (
                  <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5 px-1.5 py-0 text-[9px] text-primary">
                    <Atom className="h-2 w-2" /> PQ ✓
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Verified badges strip */}
          <div className="flex flex-wrap items-center gap-1 border-t border-border/40 px-5 py-2.5">
            {verifications.map((v) => (
              <span key={v.label} className={`inline-flex items-center gap-0.5 text-[9px] ${v.met ? 'text-primary' : 'text-muted-foreground/40'}`}>
                {v.met ? <CheckCircle2 className="h-2.5 w-2.5" /> : <XCircle className="h-2.5 w-2.5" />}
                {v.label}
              </span>
            ))}
          </div>

          {/* Card footer */}
          <div className="flex items-center justify-between border-t border-border/40 px-5 py-2 text-[9px] text-muted-foreground">
            <span>Member since {formatDate(user.createdAt)}</span>
            <span>{completed}/{verifications.length} verified</span>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-2">
        <Button variant="outline" size="sm" onClick={copySummary} className="gap-1.5">
          <Copy className="h-3.5 w-3.5" /> Copy summary
        </Button>
      </div>

      {/* Verification details */}
      <Card className="orbit-ring p-5">
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">Verification details</h3>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {verifications.map((v) => (
            <div key={v.label} className={`flex items-center gap-1.5 rounded-lg border p-2 text-xs ${v.met ? 'border-primary/20 bg-primary/5' : 'border-border/50 bg-muted/20'}`}>
              {v.met ? <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground/40" />}
              <span className={v.met ? 'text-foreground' : 'text-muted-foreground'}>{v.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* PQ attestation status */}
      <Card className="orbit-ring p-5">
        <div className="mb-3 flex items-center gap-2">
          <Atom className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">Post-quantum status</h3>
        </div>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : pq?.hasAttestation && pq?.valid ? (
          <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span>ML-DSA-65 lattice signature verified ✓ — your identity is bound to a post-quantum keypair.</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-border/60 p-3 text-sm text-muted-foreground">
            <Fingerprint className="h-4 w-4" />
            <span>No PQ attestation yet. Issue one from the Quantum tab.</span>
          </div>
        )}
      </Card>
    </div>
  )
}
