'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Fingerprint,
  ShieldCheck,
  KeyRound,
  Phone,
  Mail,
  Loader2,
  Sparkles,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/auth-store'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { CirkleMark } from '@/components/cirkle/logo'
import { startRegistration } from '@simplewebauthn/browser'

export function OnboardingWizard() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const setDashboardTab = useAuthStore((s) => s.setDashboardTab)
  const [open, setOpen] = useState(true)
  const [step, setStep] = useState(0)
  const [finishing, setFinishing] = useState(false)
  const [addingPasskey, setAddingPasskey] = useState(false)

  if (!user || user.onboardingComplete) return null

  const steps = [
    { key: 'email', icon: Mail, title: 'Email verified', met: user.emailVerified },
    { key: 'phone', icon: Phone, title: 'Phone verified', met: user.phoneVerified },
    { key: '2fa', icon: ShieldCheck, title: 'Two-factor auth', met: user.twoFactorEnabled },
    { key: 'passkey', icon: Fingerprint, title: 'Passkey (passwordless)', met: user.hasPasskey },
    { key: 'recovery', icon: KeyRound, title: 'Recovery codes', met: user.hasRecoveryCodes },
  ]
  const doneCount = steps.filter((s) => s.met).length
  const allDone = doneCount === steps.length

  async function addPasskeyNow() {
    setAddingPasskey(true)
    try {
      const { options, challengeToken } = await api.passkeyRegisterStart()
      const credential = await startRegistration({ optionsJSON: options })
      await api.passkeyRegisterFinish(credential, challengeToken)
      setUser({ ...user!, hasPasskey: true })
      toast.success('Passkey added!')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Passkey enrollment failed')
    } finally {
      setAddingPasskey(false)
    }
  }

  async function finish() {
    setFinishing(true)
    try {
      await api.completeOnboarding()
      setUser({ ...user!, onboardingComplete: true })
      setOpen(false)
      toast.success('Welcome to Cirkle — your identity is ready')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to complete setup')
    } finally {
      setFinishing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) finish(); setOpen(v) }}>
      <DialogContent className="orbit-ring max-w-lg gap-0 overflow-hidden p-0">
        {/* Header */}
        <div className="relative border-b border-border/60 p-6 text-center">
          <div className="aurora-bg absolute inset-0 -z-10 opacity-60" />
          <div className="mb-3 flex justify-center">
            <CirkleMark size={48} className="drop-shadow-[0_4px_20px_hsl(39_45%_57%_/_0.4)]" />
          </div>
          <DialogHeader className="space-y-0">
            <DialogTitle className="font-display text-center text-2xl">Secure your Cirkle identity</DialogTitle>
            <DialogDescription className="text-center">
              @{user.username} — let&apos;s set up top-of-the-line security in under a minute.
            </DialogDescription>
          </DialogHeader>
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6"
            >
              <div className="mb-4 flex items-center justify-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">Your security checklist</p>
              </div>
              <ul className="space-y-2">
                {steps.map((s) => (
                  <li key={s.key} className="orbit-ring flex items-center gap-3 px-4 py-2.5">
                    <s.icon className={`h-4 w-4 ${s.met ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="flex-1 text-sm">{s.title}</span>
                    {s.met ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                {doneCount}/{steps.length} complete — finish them all to reach the Maximum tier.
              </p>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="passkey"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 p-6"
            >
              <div className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Add a passkey</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                A passkey lets you sign in to Cirkle Authentication with your fingerprint, face, or device screen lock — no password needed. It&apos;s the modern, phishing-resistant standard.
              </p>
              {user.hasPasskey ? (
                <div className="orbit-ring flex items-center gap-2 p-3 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Passkey already added — nice!
                </div>
              ) : (
                <Button onClick={addPasskeyNow} disabled={addingPasskey} className="btn-gold w-full gap-2 border-0">
                  {addingPasskey ? <Loader2 className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-4 w-4" />}
                  {addingPasskey ? 'Authenticating…' : 'Add a passkey now'}
                </Button>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="done"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 p-6 text-center"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold">You&apos;re all set</h3>
              <p className="text-sm text-muted-foreground">
                @{user.username} is ready to reach every Cirkle app. You can finish the remaining security steps anytime from the Security Center tab.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5 text-primary">
                  {doneCount}/{steps.length} steps
                </Badge>
                {allDone && <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5 text-primary">Maximum tier</Badge>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer nav */}
        <div className="flex items-center justify-between border-t border-border/60 bg-muted/20 px-6 py-4">
          <Button variant="ghost" size="sm" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Button>
          <div className="flex gap-1.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`h-1.5 w-6 rounded-full ${i === step ? 'bg-primary' : 'bg-muted-foreground/20'}`} />
            ))}
          </div>
          {step < 2 ? (
            <Button size="sm" onClick={() => setStep((s) => s + 1)} className="btn-gold gap-1.5 border-0">
              Next <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button size="sm" onClick={finish} disabled={finishing} className="btn-gold gap-1.5 border-0">
              {finishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {finishing ? 'Finishing…' : 'Enter Cirkle'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
