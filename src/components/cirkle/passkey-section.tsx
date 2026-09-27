'use client'

import { useEffect, useState } from 'react'
import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
} from '@simplewebauthn/browser'
import {
  Fingerprint,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { formatRelativeTime } from '@/lib/format'

export function PasskeySection() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const [passkeys, setPasskeys] = useState<{ id: string; name: string; deviceType: string | null; createdAt: string; lastUsedAt: string | null }[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [supported, setSupported] = useState<boolean | null>(null)

  useEffect(() => {
    // browserSupportsWebAuthn is safe to call client-side
    setSupported(typeof window !== 'undefined' && browserSupportsWebAuthn())
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const r = await api.listPasskeys()
      setPasskeys(r.passkeys)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }

  async function addPasskey() {
    setAdding(true)
    try {
      const { options, challengeToken } = await api.passkeyRegisterStart()
      const credential = await startRegistration({ optionsJSON: options })
      await api.passkeyRegisterFinish(credential, challengeToken)
      await load()
      if (user) setUser({ ...user, hasPasskey: true })
      toast.success('Passkey added — you can now sign in passwordless')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Passkey enrollment failed')
    } finally {
      setAdding(false)
    }
  }

  async function remove(id: string) {
    try {
      await api.deletePasskey(id)
      setPasskeys((p) => p.filter((x) => x.id !== id))
      if (user && passkeys.length <= 1) setUser({ ...user, hasPasskey: false })
      toast.success('Passkey removed')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to remove passkey')
    }
  }

  return (
    <Card className="orbit-ring p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Fingerprint className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Passkeys</h3>
          <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5 text-primary">
            <ShieldCheck className="h-2.5 w-2.5" /> WebAuthn
          </Badge>
        </div>
        <Button size="sm" onClick={addPasskey} disabled={adding || supported === false} className="btn-gold gap-1.5 border-0">
          {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Add passkey
        </Button>
      </div>

      {supported === false && (
        <p className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-600 dark:text-amber-400">
          This browser doesn't support passkeys. Try Chrome, Safari, or Firefox — or use Touch ID / Face ID on a supported device.
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        </div>
      ) : passkeys.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/60 p-4 text-center">
          <KeyRound className="mx-auto h-5 w-5 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">No passkeys yet.</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Add one to sign in with your fingerprint, face, or device screen lock — no password needed.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border/50">
          {passkeys.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Fingerprint className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {p.deviceType || 'Authenticator'} · added {formatRelativeTime(p.createdAt)}
                  {p.lastUsedAt ? ` · used ${formatRelativeTime(p.lastUsedAt)}` : ''}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => remove(p.id)} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
