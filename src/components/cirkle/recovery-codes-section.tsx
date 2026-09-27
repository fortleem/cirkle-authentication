'use client'

import { useState } from 'react'
import {
  ShieldCheck,
  KeyRound,
  Copy,
  Download,
  RefreshCw,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { formatRelativeTime } from '@/lib/format'

export function RecoveryCodesSection() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const [codes, setCodes] = useState<string[] | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [revealed, setRevealed] = useState(false)

  async function generate() {
    setPending(true)
    try {
      const r = await api.generateRecoveryCodes()
      setCodes(r.codes)
      setGeneratedAt(r.generatedAt)
      setRevealed(true)
      if (user) setUser({ ...user, hasRecoveryCodes: true })
      toast.success('Recovery codes generated — save them now')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to generate codes')
    } finally {
      setPending(false)
    }
  }

  function copyAll() {
    if (!codes) return
    navigator.clipboard.writeText(codes.join('\n')).then(() => toast.success('Copied to clipboard'))
  }

  function download() {
    if (!codes) return
    const blob = new Blob([`Cirkle Authentication — Recovery Codes\n\nGenerated: ${new Date().toLocaleString()}\nUsername: @${user?.username}\n\n${codes.join('\n')}\n\nThese codes are one-time-use. Each code unlocks your account once if you ever lose access to your 2FA device. Store them somewhere safe (a password manager or printed).`], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cirkle-recovery-codes-${user?.username}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Downloaded recovery codes')
  }

  return (
    <Card className="orbit-ring p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Recovery codes</h3>
          {user?.hasRecoveryCodes && !codes && (
            <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5 text-primary">
              <CheckCircle2 className="h-2.5 w-2.5" /> Active
            </Badge>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={generate} disabled={pending} className="gap-1.5">
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          {user?.hasRecoveryCodes ? 'Regenerate' : 'Generate'}
        </Button>
      </div>

      {!user?.hasRecoveryCodes && !codes && (
        <div className="rounded-lg border border-dashed border-border/60 p-4 text-center">
          <KeyRound className="mx-auto h-5 w-5 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">No recovery codes yet.</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Generate 10 one-time codes as a 2FA fallback — use them if you ever lose your authenticator device.</p>
        </div>
      )}

      {codes && (
        <div className="space-y-3">
          {revealed && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>These codes are shown <strong>once</strong>. Copy or download them now — you won't see them again. Each code works a single time.</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-border/50 bg-muted/20 p-3 font-mono text-sm sm:grid-cols-2">
            {codes.map((c, i) => (
              <div key={i} className="px-1 py-0.5 tracking-wider text-foreground">{c}</div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={copyAll} className="gap-1.5">
              <Copy className="h-3.5 w-3.5" /> Copy all
            </Button>
            <Button size="sm" variant="outline" onClick={download} className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> Download .txt
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setRevealed(false)} className="ml-auto">
              Hide
            </Button>
          </div>
        </div>
      )}

      {user?.hasRecoveryCodes && !codes && (
        <p className="text-xs text-muted-foreground">You have active recovery codes. Regenerating will invalidate the old ones.</p>
      )}
    </Card>
  )
}
