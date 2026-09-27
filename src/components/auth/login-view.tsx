'use client'

import { useState } from 'react'
import { Loader2, AtSign, Lock, ArrowRight, Fingerprint, KeyRound, AtSign as AtSignIcon } from 'lucide-react'
import { startAuthentication, browserSupportsWebAuthn } from '@simplewebauthn/browser'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { AuthShell } from '@/components/auth/auth-shell'
import { useAuthStore } from '@/stores/auth-store'
import { api } from '@/lib/api'
import { CirkleMark } from '@/components/cirkle/logo'

export function LoginView() {
  const setUser = useAuthStore((s) => s.setUser)
  const setView = useAuthStore((s) => s.setView)
  const setStats = useAuthStore((s) => s.setStats)
  const setBusinesses = useAuthStore((s) => s.setBusinesses)
  const setActiveBusinessId = useAuthStore((s) => s.setActiveBusinessId)

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [passkeyPending, setPasskeyPending] = useState(false)
  const [recoveryMode, setRecoveryMode] = useState(false)
  const [recoveryCode, setRecoveryCode] = useState('')
  const [errors, setErrors] = useState<{ identifier?: string; password?: string; code?: string }>({})

  const passkeySupported = typeof window !== 'undefined' && browserSupportsWebAuthn()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    if (!identifier.trim()) next.identifier = 'Enter your username or email'
    if (!recoveryMode && !password) next.password = 'Password is required'
    if (recoveryMode && recoveryCode.trim().length < 8) next.code = 'Enter a recovery code'
    setErrors(next)
    if (Object.keys(next).length) return

    setPending(true)
    try {
      if (recoveryMode) {
        const { user } = await api.loginWithRecoveryCode(identifier.trim(), recoveryCode.trim())
        await afterLogin(user)
        toast.success(`Signed in via recovery code — welcome back, ${user.name.split(' ')[0]}`)
      } else {
        const { user } = await api.login({ identifier: identifier.trim(), password })
        await afterLogin(user)
        toast.success(`Welcome back, ${user.name.split(' ')[0]}!`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setPending(false)
    }
  }

  async function afterLogin(user: ReturnType<typeof useAuthStore.getState>['user']) {
    if (!user) return
    setUser(user)
    setView('dashboard')
    api.getMe().then((r) => {
      if (r) {
        setStats(r.stats)
        setBusinesses(r.businesses)
        if (r.businesses.length > 0) setActiveBusinessId(r.businesses[0].id)
      }
    }).catch(() => {})
  }

  async function signInWithPasskey() {
    setPasskeyPending(true)
    try {
      const { options, challengeToken } = await api.passkeyLoginStart()
      const credential = await startAuthentication({ optionsJSON: options })
      const { user } = await api.passkeyLoginFinish(credential, challengeToken)
      await afterLogin(user)
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`)
    } catch (e) {
      if (e instanceof Error && e.message.includes('NotAllowed')) {
        toast.error('Passkey canceled')
      } else {
        toast.error(e instanceof Error ? e.message : 'Passkey sign-in failed')
      }
    } finally {
      setPasskeyPending(false)
    }
  }

  function fillDemo() {
    setIdentifier('cirkle')
    setPassword('cirkle2025')
    setErrors({})
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in with your Cirkle username or email — one identity reaches every app."
      footer={
        <>
          New to Cirkle?{' '}
          <button
            onClick={() => setView('register')}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Create an account
          </button>
        </>
      }
    >
      {/* Passwordless passkey sign-in — the top-of-line primary */}
      {passkeySupported && !recoveryMode && (
        <div className="mb-4">
          <Button onClick={signInWithPasskey} disabled={passkeyPending} variant="outline" className="orbit-ring w-full gap-2 border-0">
            {passkeyPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-4 w-4 text-primary" />}
            {passkeyPending ? 'Authenticating…' : 'Sign in with passkey'}
          </Button>
          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-border/60" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border/60" />
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="identifier">Username or email</Label>
          <div className="relative">
            <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="identifier"
              type="text"
              autoComplete="username"
              placeholder="cirkle or you@cirkle.app"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="pl-9"
              aria-invalid={!!errors.identifier}
            />
          </div>
          {errors.identifier && <p className="text-xs text-destructive">{errors.identifier}</p>}
        </div>

        {recoveryMode ? (
          <div className="space-y-1.5">
            <Label htmlFor="recovery-code">Recovery code</Label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="recovery-code"
                type="text"
                autoComplete="one-time-code"
                placeholder="XXXX-XXXX-XXXX"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                className="pl-9 font-mono"
                aria-invalid={!!errors.code}
              />
            </div>
            {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
            <p className="text-[11px] text-muted-foreground">Use a one-time recovery code if you lost access to your 2FA device.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => toast.info('Password reset is not enabled in this preview')}>
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9"
                aria-invalid={!!errors.password}
              />
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
          </div>
        )}

        <Button type="submit" disabled={pending} className="btn-gold w-full gap-2 border-0">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {pending ? 'Signing in…' : recoveryMode ? 'Sign in with code' : 'Sign in'}
          {!pending && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => { setRecoveryMode((v) => !v); setErrors({}) }}
        className="mt-4 w-full text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        {recoveryMode ? '← Back to password sign-in' : 'Lost your 2FA device? Use a recovery code'}
      </button>

      <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/30 p-3 text-center text-xs text-muted-foreground">
        Demo account available —{' '}
        <button type="button" onClick={fillDemo} className="font-medium text-primary hover:underline">
          fill credentials
        </button>
        <div className="mt-1 font-mono text-[11px]">username: cirkle · password: cirkle2025</div>
      </div>
    </AuthShell>
  )
}
