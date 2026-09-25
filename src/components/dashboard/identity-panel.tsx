'use client'

import { useState } from 'react'
import {
  Mail,
  Phone,
  ShieldCheck,
  BadgeCheck,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  IdCard,
  Building2,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { formatRelativeTime } from '@/lib/format'

interface VStep {
  key: 'email' | 'phone' | 'kyc' | 'twoFactor' | 'business'
  icon: typeof Mail
  title: string
  description: string
  met: boolean
  meta?: string
}

export function IdentityPanel() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const setDashboardTab = useAuthStore((s) => s.setDashboardTab)

  const [phoneInput, setPhoneInput] = useState('')
  const [phonePending, setPhonePending] = useState(false)
  const [kycStage, setKycStage] = useState<'idle' | 'started' | 'completing'>('idle')

  if (!user) return null

  const steps: VStep[] = [
    { key: 'email', icon: Mail, title: 'Email verified', description: 'Your email is confirmed and trusted.', met: user.emailVerified, meta: user.email },
    { key: 'phone', icon: Phone, title: 'Phone verified', description: 'Adds a recovery channel and unlocks Enhanced apps.', met: user.phoneVerified, meta: user.phone ?? undefined },
    { key: 'kyc', icon: IdCard, title: 'Identity (KYC)', description: 'Government ID + selfie verification via Cirkle Verify. Required for Strict-level apps.', met: user.kycVerified },
    { key: 'twoFactor', icon: ShieldCheck, title: 'Two-factor auth', description: 'One-time code at sign-in. Required by finance, legal & healthcare apps.', met: user.twoFactorEnabled },
    { key: 'business', icon: Building2, title: 'Business profile', description: 'A verified business is required for SGTX, PPE, MTQ Sigma & Olymp-Ex.', met: user.businessVerified },
  ]

  const completed = steps.filter((s) => s.met).length
  const tier = completed >= 5 ? 'Maximum' : completed >= 3 ? 'Enhanced' : completed >= 1 ? 'Basic' : 'Unverified'

  async function verifyPhone() {
    if (!phoneInput.trim() || phoneInput.trim().length < 7) {
      toast.error('Enter a valid phone number')
      return
    }
    setPhonePending(true)
    try {
      await api.verifyPhone(phoneInput.trim())
      setUser({ ...user, phone: phoneInput.trim(), phoneVerified: true })
      toast.success('Phone number verified')
      setPhoneInput('')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to verify phone')
    } finally {
      setPhonePending(false)
    }
  }

  async function startKyc() {
    setKycStage('started')
    try {
      const r = await api.startKyc()
      toast.info(r.message)
      // stay in 'started' so the user can click "Complete verification"
      setKycStage('started')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to start KYC')
      setKycStage('idle')
    }
  }

  async function completeKyc() {
    setKycStage('completing')
    try {
      await api.completeKyc()
      setUser({ ...user, kycVerified: true })
      toast.success('Identity verified — Strict-level apps are now available')
      setKycStage('idle')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to complete KYC')
      setKycStage('started')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Identity & verification</h1>
        <p className="text-sm text-muted-foreground">
          Complete verification steps to unlock stricter Cirkle platforms. Your single identity ({' '}
          <span className="font-medium text-foreground">@{user.username}</span>) carries all of this.
        </p>
      </div>

      {/* Verification tier summary */}
      <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/8 via-card to-card p-6">
        <div className="cirkle-mesh absolute inset-0 -z-10 opacity-50" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge variant="outline" className="mb-2 gap-1.5 border-primary/30 bg-primary/5 text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Verification tier: {tier}
            </Badge>
            <h3 className="text-lg font-semibold">{completed} of {steps.length} verification steps complete</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Higher tiers unlock finance, healthcare, legal, and maritime platforms.
            </p>
          </div>
          <div className="flex gap-1">
            {steps.map((s) => (
              <div key={s.key} className={`h-2 w-8 rounded-full ${s.met ? 'bg-primary' : 'bg-muted-foreground/20'}`} />
            ))}
          </div>
        </div>
      </Card>

      {/* Verification steps */}
      <div className="space-y-3">
        {steps.map((step) => (
          <Card key={step.key} className={`p-5 ${step.met ? 'border-primary/20' : ''}`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${step.met ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                <step.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium">{step.title}</h3>
                  {step.met ? (
                    <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5 text-primary">
                      <CheckCircle2 className="h-3 w-3" /> Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <XCircle className="h-3 w-3" /> Pending
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                {step.meta && (
                  <p className="mt-1.5 text-xs font-mono text-muted-foreground">{step.meta}</p>
                )}

                {/* Actions for unmet steps */}
                {!step.met && (
                  <div className="mt-3">
                    {step.key === 'phone' && (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                        <div className="flex-1 space-y-1.5">
                          <Label htmlFor="phone-input" className="text-xs">Phone number</Label>
                          <Input
                            id="phone-input"
                            type="tel"
                            placeholder="+20 100 123 4567"
                            value={phoneInput}
                            onChange={(e) => setPhoneInput(e.target.value)}
                          />
                        </div>
                        <Button size="sm" onClick={verifyPhone} disabled={phonePending} className="gap-1.5">
                          {phonePending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Phone className="h-3.5 w-3.5" />}
                          Verify phone
                        </Button>
                      </div>
                    )}
                    {step.key === 'kyc' && (
                      <div className="flex flex-wrap items-center gap-2">
                        {kycStage === 'idle' && (
                          <Button size="sm" variant="outline" onClick={startKyc} className="gap-1.5">
                            <IdCard className="h-3.5 w-3.5" /> Start KYC
                          </Button>
                        )}
                        {kycStage === 'started' && (
                          <Button size="sm" onClick={completeKyc} className="gap-1.5">
                            <BadgeCheck className="h-3.5 w-3.5" /> Complete verification
                          </Button>
                        )}
                        {kycStage === 'completing' && (
                          <Button size="sm" disabled className="gap-1.5">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Verifying…
                          </Button>
                        )}
                      </div>
                    )}
                    {step.key === 'twoFactor' && (
                      <Button size="sm" variant="outline" onClick={() => setDashboardTab('security')} className="gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5" /> Set up 2FA <ArrowRight className="h-3 w-3" />
                      </Button>
                    )}
                    {step.key === 'business' && (
                      <Button size="sm" variant="outline" onClick={() => setDashboardTab('business')} className="gap-1.5">
                        <Building2 className="h-3.5 w-3.5" /> Add a business <ArrowRight className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Identity: <strong className="text-foreground">@{user.username}</strong> · Member since {formatRelativeTime(user.createdAt)}
      </p>
    </div>
  )
}
