'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, ExternalLink, Loader2, ShieldCheck, User, Mail, KeyRound } from 'lucide-react'
import type { EcosystemApp } from '@/lib/api'
import { getAppIcon } from '@/components/cirkle/app-icons'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { CirkleMark } from '@/components/cirkle/logo'

const SCOPES = [
  { key: 'openid', label: 'Verify your Cirkle identity', icon: KeyRound },
  { key: 'profile', label: 'Read your name and avatar', icon: User },
  { key: 'email', label: 'Read your email address', icon: Mail },
]

export function SsoConsentModal({
  app,
  open,
  onOpenChange,
  onAuthorized,
}: {
  app: EcosystemApp | null
  open: boolean
  onOpenChange: (v: boolean) => void
  onAuthorized?: (app: EcosystemApp) => void
}) {
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<{ redirectUrl: string | null; app: { id: string; name: string; slug: string; homepage: string } } | null>(null)

  if (!app) return null
  const Icon = getAppIcon(app.icon)

  async function authorize() {
    if (!app) return
    setPending(true)
    try {
      const res = await api.authorizeApp(app.id)
      setResult(res)
      onAuthorized?.(app)
      toast.success(`Access granted to ${app.name}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Authorization failed')
    } finally {
      setPending(false)
    }
  }

  function close() {
    setResult(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!pending) { close(); onOpenChange(v) } }}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
        {/* Header banner */}
        <div className="relative border-b border-border/60 bg-gradient-to-br from-primary/8 to-card p-6">
          <div className="cirkle-mesh absolute inset-0 -z-10 opacity-50" />
          <DialogHeader className="space-y-0">
            <div className="mb-3 flex items-center gap-3">
              <CirkleMark size={28} />
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>Cirkle</span>
                <span className="text-muted-foreground/50">›</span>
                <span className="font-medium text-foreground">Authorize app</span>
              </div>
            </div>
            <DialogTitle className="text-xl">
              {result ? 'You\'re all set' : `Authorize ${app.name}`}
            </DialogTitle>
            <DialogDescription>
              {result
                ? `${app.name} can now access your Cirkle identity.`
                : `${app.name} is requesting access to your Cirkle identity.`}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-5 p-6">
          {/* App identity */}
          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
              style={{ backgroundColor: app.color }}
            >
              <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-semibold">{app.name}</p>
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">{app.category}</Badge>
              </div>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{app.description}</p>
            </div>
          </div>

          {result ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Authorization recorded in your audit log.</span>
              </div>
              <p className="text-xs text-muted-foreground">
                You can revoke this access at any time from your dashboard.
              </p>
            </div>
          ) : (
            <>
              <div>
                <p className="mb-2 text-sm font-medium">
                  <ShieldCheck className="mr-1.5 inline h-4 w-4 text-primary" />
                  {app.name} will be able to:
                </p>
                <ul className="space-y-2">
                  {SCOPES.map((s) => (
                    <li key={s.key} className="flex items-start gap-2.5 rounded-lg border border-border/50 bg-background/60 px-3 py-2">
                      <s.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="text-sm">{s.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                <strong className="text-foreground">Not shared:</strong> your password, 2FA secret, or session tokens.
              </div>
            </>
          )}
        </div>

        <DialogFooter className="border-t border-border/60 bg-muted/20 px-6 py-4">
          {result ? (
            <>
              <Button variant="outline" onClick={close} className="gap-1.5">
                Back to dashboard
              </Button>
              <Button asChild className="gap-1.5">
                <a
                  href={result.redirectUrl || app.homepage}
                  target="_blank"
                  rel="noreferrer"
                >
                  Continue to {app.name} <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={close} disabled={pending}>
                Cancel
              </Button>
              <Button onClick={authorize} disabled={pending} className="gap-2">
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                {pending ? 'Authorizing…' : `Authorize ${app.name}`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
