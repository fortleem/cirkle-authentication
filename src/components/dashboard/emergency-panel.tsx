'use client'

import { useState } from 'react'
import {
  Siren,
  ShieldX,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Zap,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'

export function EmergencyPanel() {
  const user = useAuthStore((s) => s.user)
  const reset = useAuthStore((s) => s.reset)
  const setView = useAuthStore((s) => s.setView)
  const [pending, setPending] = useState(false)

  async function activate() {
    setPending(true)
    try {
      const r = await api.emergencyLockdown()
      toast.success('Emergency lockdown activated — all sessions + authorizations revoked')
      reset()
      // small delay then go to landing (the cookie is cleared server-side)
      setTimeout(() => setView('landing'), 600)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lockdown failed')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Siren className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          <h1 className="text-2xl font-semibold tracking-tight">Emergency Lockdown</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          The panic button. One click instantly revokes <strong>every active session</strong> across all your devices + <strong>every app authorization</strong> + locks your identity. Sign-in is blocked until you re-authenticate via emergency unlock. Use it if you suspect a breach or a lost device.
        </p>
      </div>

      {/* Status */}
      <Card className={`orbit-ring p-5 ${user?.locked ? 'border-rose-500/40' : 'border-primary/20'}`}>
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${user?.locked ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-primary/10 text-primary'}`}>
            {user?.locked ? <ShieldX className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
          </div>
          <div>
            <p className="font-semibold">{user?.locked ? 'Identity is LOCKED' : 'Identity is active'}</p>
            <p className="text-xs text-muted-foreground">
              {user?.locked
                ? 'Sign-in is blocked. Use emergency unlock (on the sign-in page) with your password to lift the lockdown.'
                : 'Everything is operating normally. You can activate an emergency lockdown at any time.'}
            </p>
          </div>
          {user?.locked && (
            <Badge variant="outline" className="ml-auto gap-1 border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Lock className="h-3 w-3" /> locked
            </Badge>
          )}
        </div>
      </Card>

      {/* What it does */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="orbit-ring p-4">
          <Zap className="mb-2 h-5 w-5 text-rose-600 dark:text-rose-400" />
          <p className="text-sm font-medium">Revokes all sessions</p>
          <p className="mt-1 text-xs text-muted-foreground">Every device is signed out instantly — including the one you're on.</p>
        </Card>
        <Card className="orbit-ring p-4">
          <ShieldX className="mb-2 h-5 w-5 text-rose-600 dark:text-rose-400" />
          <p className="text-sm font-medium">Revokes all app access</p>
          <p className="mt-1 text-xs text-muted-foreground">Every Cirkle app loses access to your identity. You re-authorize them later.</p>
        </Card>
        <Card className="orbit-ring p-4">
          <Lock className="mb-2 h-5 w-5 text-rose-600 dark:text-rose-400" />
          <p className="text-sm font-medium">Locks the identity</p>
          <p className="mt-1 text-xs text-muted-foreground">Sign-in is blocked. Re-auth with your password via emergency unlock to lift it.</p>
        </Card>
      </div>

      {/* The panic button */}
      <Card className="orbit-ring border-rose-500/40 p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative">
            <div className="absolute inset-0 -z-10 animate-pulse-ring rounded-full bg-rose-500/20 blur-2xl" />
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Siren className="h-8 w-8" />
            </div>
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold">Activate Emergency Lockdown</h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              This is irreversible from other devices. It immediately kills all sessions + app authorizations + locks sign-in. You'll be signed out and redirected to the sign-in page's emergency-unlock flow.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="lg" className="gap-2 bg-rose-600 text-white hover:bg-rose-700" disabled={pending || !!user?.locked}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Siren className="h-4 w-4" />}
                {user?.locked ? 'Identity already locked' : 'Activate lockdown'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="h-5 w-5" /> Confirm emergency lockdown?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This instantly revokes ALL sessions + ALL app authorizations + locks your identity. You'll be signed out. You'll need your password to unlock. This is the nuclear option — only use it if you suspect a breach or a lost device.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => { e.preventDefault(); activate() }}
                  disabled={pending}
                  className="bg-rose-600 text-white hover:bg-rose-700"
                >
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Yes — lock down everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 text-primary" /> Reversible via emergency unlock with your password
          </p>
        </div>
      </Card>
    </div>
  )
}
