'use client'

import { useEffect, useMemo, useState } from 'react'
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
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Building2,
  KeyRound,
} from 'lucide-react'
import type { EcosystemApp, RequirementCheck } from '@/lib/api'
import { getAppIcon } from '@/components/cirkle/app-icons'
import { api, isRequirementsMissing, type ApiError } from '@/lib/api'
import { toast } from 'sonner'
import { CirkleMark } from '@/components/cirkle/logo'
import { useAuthStore } from '@/stores/auth-store'
import { checkRequirements, requirementSummary, identityTypeLabel, verificationLevelLabel } from '@/lib/requirements'
import { RequirementBadges } from '@/components/cirkle/requirement-badges'

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
  const user = useAuthStore((s) => s.user)
  const businesses = useAuthStore((s) => s.businesses)
  const activeBusinessId = useAuthStore((s) => s.activeBusinessId)
  const setDashboardTab = useAuthStore((s) => s.setDashboardTab)

  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<{ redirectUrl: string | null; app: { id: string; name: string; slug: string; homepage: string }; contextType: string } | null>(null)
  const [missing, setMissing] = useState<RequirementCheck[] | null>(null)

  // Recompute the requirement checks whenever the app or user changes
  const checks = useMemo<RequirementCheck[]>(() => {
    if (!app || !user) return []
    return checkRequirements(app.requirements, {
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      kycVerified: user.kycVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      businessVerified: user.businessVerified,
    })
  }, [app, user])

  const allMet = checks.length > 0 && checks.every((c) => c.met)

  // Reset state when the modal is closed or app changes
  useEffect(() => {
    if (open) {
      setResult(null)
      setMissing(null)
    }
  }, [open, app?.id])

  if (!app) return null
  const Icon = getAppIcon(app.icon)
  const needsBusiness = app.requirements.businessRequired || app.requirements.identityType === 'business'
  const activeBusiness = businesses.find((b) => b.id === activeBusinessId)

  async function authorize() {
    if (!app) return
    setPending(true)
    setMissing(null)
    try {
      const opts = needsBusiness ? { businessId: activeBusinessId ?? undefined } : {}
      const res = await api.authorizeApp(app.id, opts)
      setResult(res)
      onAuthorized?.(app)
      toast.success(`Access granted to ${app.name}`)
    } catch (err) {
      if (isRequirementsMissing(err)) {
        const data = (err as ApiError).data as { missing?: RequirementCheck[]; missingBusiness?: boolean }
        setMissing(data.missing ?? [])
        if (data.missingBusiness) {
          toast.error('A verified business profile is required for this app')
        }
      } else {
        toast.error(err instanceof Error ? err.message : 'Authorization failed')
      }
    } finally {
      setPending(false)
    }
  }

  function close() {
    setResult(null)
    setMissing(null)
    onOpenChange(false)
  }

  const showMissingBlock = !!missing && missing.length > 0 && !result

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!pending) close(); onOpenChange(v) }}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
        {/* Header */}
        <div className="relative border-b border-border/60 bg-gradient-to-br from-primary/8 to-card p-6">
          <div className="cirkle-mesh absolute inset-0 -z-10 opacity-50" />
          <DialogHeader className="space-y-0">
            <div className="mb-3 flex items-center gap-3">
              <CirkleMark size={28} />
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>Cirkle</span>
                <span className="text-muted-foreground/50">›</span>
                <span className="font-medium text-foreground">{result ? 'Authorized' : 'Authorize app'}</span>
              </div>
            </div>
            <DialogTitle className="text-xl">
              {result ? 'You\'re all set' : `Authorize ${app.name}`}
            </DialogTitle>
            <DialogDescription>
              {result
                ? `${app.name} can now access your Cirkle identity${needsBusiness ? ' (business context)' : ''}.`
                : `${app.name} requests scoped access to your Cirkle identity.`}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-5 p-6">
          {/* App identity */}
          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-sm" style={{ backgroundColor: app.color }}>
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
              {needsBusiness && activeBusiness && (
                <p className="text-xs text-muted-foreground">
                  Authorized on behalf of <strong className="text-foreground">{activeBusiness.name}</strong>.
                </p>
              )}
            </div>
          ) : showMissingBlock ? (
            /* Requirements NOT met — guide the user */
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="text-sm font-medium">Complete these steps first</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    This platform requires additional verification before you can authorize it.
                  </p>
                </div>
              </div>
              <ul className="space-y-2">
                {missing!.map((m) => (
                  <li key={m.key} className="flex items-start justify-between gap-3 rounded-lg border border-border/50 bg-background/60 px-3 py-2.5">
                    <div>
                      <p className="text-sm font-medium">{m.label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{m.description}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onOpenChange(false)
                        setDashboardTab(m.key === 'business' ? 'business' : 'identity')
                      }}
                      className="gap-1"
                    >
                      Complete <ArrowRight className="h-3 w-3" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            /* Dynamic requirements summary */
            <>
              <div>
                <div className="mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">Authentication requirements</p>
                </div>
                <RequirementBadges reqs={app.requirements} />
                <p className="mt-2 text-xs text-muted-foreground">
                  {identityTypeLabel(app.requirements.identityType)} identity · {verificationLevelLabel(app.requirements.verificationLevel)} verification
                  {app.requirements.twoFactorRequired ? ' · 2FA mandatory' : ''}
                </p>
              </div>

              {/* Per-app requirement checklist (live, with inline Complete actions) */}
              <div>
                <p className="mb-2 text-sm font-medium">
                  {allMet ? 'Your identity meets all requirements' : 'Complete the highlighted steps to authorize'}
                </p>
                <ul className="space-y-1.5">
                  {checks.map((c) => (
                    <li key={c.key} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${c.met ? '' : 'bg-amber-500/5'}`}>
                      {c.met ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                      ) : (
                        <div className="h-4 w-4 shrink-0 rounded-full border-2 border-amber-500/60" />
                      )}
                      <span className={`flex-1 ${c.met ? 'text-foreground' : 'text-muted-foreground'}`}>{c.label}</span>
                      {!c.met && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 gap-1 px-2 text-xs text-primary hover:bg-primary/10"
                          onClick={() => {
                            onOpenChange(false)
                            setDashboardTab(c.key === 'business' ? 'business' : 'identity')
                          }}
                        >
                          Complete <ArrowRight className="h-3 w-3" />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Business context selector */}
              {needsBusiness && (
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                  <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium">
                    <Building2 className="h-3.5 w-3.5 text-primary" /> Business context
                  </div>
                  {activeBusiness ? (
                    <p className="text-sm">{activeBusiness.name} <span className="text-xs text-muted-foreground">· {activeBusiness.verified ? 'verified' : 'pending'}</span></p>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">No active business profile.</p>
                      <Button size="sm" variant="outline" onClick={() => { onOpenChange(false); setDashboardTab('business') }} className="gap-1">
                        Add business <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Scopes */}
              <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                <div className="mb-1 flex items-center gap-1.5 font-medium text-foreground">
                  <KeyRound className="h-3 w-3" /> Scopes granted
                </div>
                <code className="font-mono text-[11px]">{app.requirements.requiredScopes}</code>
                <p className="mt-1.5"><strong className="text-foreground">Not shared:</strong> password, 2FA secret, session tokens.</p>
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
                <a href={result.redirectUrl || app.homepage} target="_blank" rel="noreferrer">
                  Continue to {app.name} <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </>
          ) : showMissingBlock ? (
            <Button variant="outline" onClick={close}>Close</Button>
          ) : (
            <>
              <Button variant="outline" onClick={close} disabled={pending}>Cancel</Button>
              <Button onClick={authorize} disabled={pending || !allMet} className="gap-2">
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
