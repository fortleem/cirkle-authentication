'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Mail, Lock, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { AuthShell } from '@/components/auth/auth-shell'
import { useAuthStore } from '@/stores/auth-store'
import { api } from '@/lib/api'

export function LoginView() {
  const setUser = useAuthStore((s) => s.setUser)
  const setView = useAuthStore((s) => s.setView)
  const setStats = useAuthStore((s) => s.setStats)
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    if (!email.trim()) next.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email'
    if (!password) next.password = 'Password is required'
    setErrors(next)
    if (Object.keys(next).length) return

    setPending(true)
    try {
      const { user } = await api.login({ email: email.trim(), password })
      setUser(user)
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`)
      // Refresh stats
      api.getMe().then((r) => r && setStats(r.stats)).catch(() => {})
      setView('dashboard')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setPending(false)
    }
  }

  function fillDemo() {
    setEmail('demo@cirkle.app')
    setPassword('cirkle2025')
    setErrors({})
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your Cirkle identity and reach every connected app."
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
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@cirkle.app"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9"
              aria-invalid={!!errors.email}
            />
          </div>
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>

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

        <Button type="submit" disabled={pending} className="w-full gap-2">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {pending ? 'Signing in…' : 'Sign in'}
          {!pending && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>

      <div className="mt-5 rounded-xl border border-dashed border-border bg-muted/30 p-3 text-center text-xs text-muted-foreground">
        Demo account available —{' '}
        <button type="button" onClick={fillDemo} className="font-medium text-primary hover:underline">
          fill credentials
        </button>
        <div className="mt-1 font-mono text-[11px]">demo@cirkle.app · cirkle2025</div>
      </div>
    </AuthShell>
  )
}
