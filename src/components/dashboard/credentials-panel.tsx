'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Award,
  Plus,
  Loader2,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  KeyRound,
  Copy,
  Sparkles,
  Atom,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { formatRelativeTime } from '@/lib/format'
import { CirkleMark } from '@/components/cirkle/logo'

const CRED_TYPES = [
  { type: 'CirkleEmailVerification', label: 'Email verified', check: (u: any) => u.emailVerified },
  { type: 'CirklePhoneVerified', label: 'Phone verified', check: (u: any) => u.phoneVerified },
  { type: 'CirkleKYCVerified', label: 'KYC verified', check: (u: any) => u.kycVerified },
  { type: 'CirkleBusinessVerified', label: 'Business verified', check: (u: any) => u.businessVerified },
  { type: 'Cirkle2FAEnabled', label: '2FA enabled', check: (u: any) => u.twoFactorEnabled },
]

export function CredentialsPanel() {
  const user = useAuthStore((s) => s.user)
  const [credentials, setCredentials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState<string | null>(null)
  const [verifying, setVerifying] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const r = await api.listCredentials()
      setCredentials(r.credentials)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  async function issue(type: string) {
    setPending(type)
    try {
      const r = await api.issueCredential(type)
      toast.success('Credential issued — signed with your PQ key')
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Issue failed')
    } finally { setPending(null) }
  }

  async function verify(id: string) {
    setVerifying(id)
    try {
      const r = await api.verifyCredential(id)
      if (r.valid) toast.success('PQ signature verified ✓')
      else toast.error('Credential revoked')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Verify failed')
    } finally { setVerifying(null) }
  }

  function copyCredential(cred: any) {
    const text = `Cirkle Verifiable Credential\n━━━━━━━━━━━━━━\nType: ${cred.type}\nIssuer: ${cred.issuer}\nSubject: @${cred.subject.username}\nAttribute: ${cred.subject.attribute}\nVerified: ${cred.subject.verifiedAt}\nAlgorithm: ${cred.algorithm}\n━━━━━━━━━━━━━━`
    navigator.clipboard.writeText(text).then(() => toast.success('Credential summary copied'))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">Verifiable Credentials</h1>
          <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5 text-primary">
            <Atom className="h-2.5 w-2.5" /> ML-DSA-65 signed
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Self-sovereign, post-quantum-signed credentials proving your verified attributes — present them to any third party without revealing personal data. Each is signed with your ML-DSA-65 lattice key (from the Quantum tab).
        </p>
      </div>

      {/* Issue new credentials */}
      <Card className="orbit-ring p-5">
        <div className="mb-3 flex items-center gap-2">
          <Plus className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">Issue a credential</h3>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {CRED_TYPES.map((ct) => {
            const met = user ? ct.check(user) : false
            const hasCred = credentials.some((c) => c.type === ct.type)
            return (
              <div
                key={ct.type}
                className={`flex items-center justify-between rounded-lg border p-3 ${met ? 'border-primary/20 bg-primary/5' : 'border-border/50 bg-muted/20 opacity-60'}`}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className={`h-4 w-4 ${met ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="text-sm">{ct.label}</span>
                  {hasCred && <CheckCircle2 className="h-3 w-3 text-primary" />}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => issue(ct.type)}
                  disabled={!met || pending === ct.type || hasCred}
                  className="gap-1 text-xs"
                >
                  {pending === ct.type ? <Loader2 className="h-3 w-3 animate-spin" /> : <KeyRound className="h-3 w-3" />}
                  {hasCred ? 'Issued' : met ? 'Issue' : 'Not verified'}
                </Button>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Credential wallet */}
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : credentials.length === 0 ? (
        <Card className="orbit-ring flex flex-col items-center gap-2 p-8 text-center">
          <Award className="h-6 w-6 text-muted-foreground" />
          <h3 className="font-semibold">No credentials issued yet</h3>
          <p className="max-w-md text-sm text-muted-foreground">Issue a credential for any verified attribute above. Each is signed with your post-quantum ML-DSA-65 key — a lattice signature that survives quantum computers.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <AnimatePresence>
            {credentials.map((cred, i) => (
              <motion.div
                key={cred.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, delay: Math.min(i * 0.05, 0.3) }}
              >
                <Card className="orbit-ring relative overflow-hidden p-5">
                  <div className="aurora-bg absolute inset-0 -z-10 opacity-30" />
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CirkleMark size={20} />
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{cred.issuer}</span>
                    </div>
                    <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5 text-primary">
                      <Atom className="h-2.5 w-2.5" /> PQ
                    </Badge>
                  </div>
                  <h3 className="font-display text-lg font-semibold">{cred.subject.attribute === 'email' ? 'Email Verification' : cred.subject.attribute === 'kyc' ? 'KYC Verified' : cred.subject.attribute === 'business' ? 'Business Verified' : cred.subject.attribute === 'phone' ? 'Phone Verified' : '2FA Enabled'}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    @{cred.subject.username} · issued {formatRelativeTime(cred.createdAt)}
                  </p>
                  <div className="mt-3 rounded-lg border border-border/50 bg-muted/20 p-2 font-mono text-[10px] text-muted-foreground">
                    <div className="break-all line-clamp-2">{cred.message}</div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => verify(cred.id)} disabled={verifying === cred.id} className="gap-1.5">
                      {verifying === cred.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3" />}
                      Verify
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => copyCredential(cred)} className="gap-1.5">
                      <Copy className="h-3 w-3" /> Copy
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Each credential is a real ML-DSA-65 (FIPS 204) lattice signature — provably tamper-proof, even against a quantum computer. Present the credential + your PQ public key to any verifier.
      </p>
    </div>
  )
}
