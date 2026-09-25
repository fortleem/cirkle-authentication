'use client'

import { useMemo, useState } from 'react'
import { Loader2, Mail, Lock, User, AtSign, ArrowRight, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { AuthShell } from '@/components/auth/auth-shell'
import { useAuthStore } from '@/stores/auth-store'
import { api } from '@/lib/api'

interface PwChecks {
  length: boolean
  upper: boolean
  number: boolean
  special: boolean
}

function checkPw(pw: string): PwChecks {
  return {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  }
}

export function RegisterView() {
  const setUser = useAuthStore((s) => s.setUser)
  const setView = useAuthStore((s) => s.setView)
  const setStats = useAuthStore((s) => s.setStats)
  const setBusinesses = useAuthStore((s) => s.setBusinesses)

  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; username?: string; email?: string; password?: string }>({})

  const pwChecks = useMemo(() => checkPw(password), [password])
  const pwScore = Object.values(pwChecks).filter(Boolean).length

  const usernameValid = /^[a-zA-Z0-9_.-]{3,30}$/.test(username)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    if (name.trim().length < 2) next.name = 'Enter your full name'
    if (!usernameValid) next.username = '3–30 chars: letters, numbers, dot, dash, underscore'
    if (!email.trim()) next.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email'
    if (!pwChecks.length) next.password = 'Password must be at least 8 characters'
    setErrors(next)
    if (Object.keys(next).length) return

    setPending(true)
    try {
      const { user } = await api.register({ name: name.trim(), username: username.trim(), email: email.trim(), password })
      setUser(user)
      setStats({ connectedApps: 0, activeSessions: 1, auditEvents: 2, businesses: 0 })
      setBusinesses([])
      toast.success(`Welcome to Cirkle, ${user.name.split(' ')[0]}! Your username is @${user.username}`)
      setView('dashboard')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthShell
      title="Create your Cirkle identity"
      subtitle="One username unlocks Cirkle-Search and every product — personal and business alike."
      footer={
        <>
          Already have an account?{' '}
          <button
            onClick={() => setView('login')}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Alex Cirkle"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pl-9"
              aria-invalid={!!errors.name}
            />
          </div>
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="username"
              type="text"
              autoComplete="username"
              placeholder="alex.cirkle"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              className="pl-9"
              aria-invalid={!!errors.username}
            />
          </div>
          {errors.username && <p className="text-xs text-destructive">{errors.username}</p>}
          {usernameValid && !errors.username && (
            <p className="text-xs text-primary">Your handle across the whole ecosystem</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="r-email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="r-email"
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
          <Label htmlFor="r-password">Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="r-password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9"
              aria-invalid={!!errors.password}
            />
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}

          {password.length > 0 && (
            <div className="mt-2 space-y-2">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      i < pwScore
                        ? pwScore <= 1
                          ? 'bg-destructive'
                          : pwScore === 2
                            ? 'bg-amber-500'
                            : pwScore === 3
                              ? 'bg-yellow-500'
                              : 'bg-primary'
                        : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
              <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                {([
                  ['8+ characters', pwChecks.length],
                  ['Uppercase letter', pwChecks.upper],
                  ['A number', pwChecks.number],
                  ['A symbol', pwChecks.special],
                ] as const).map(([label, ok]) => (
                  <li key={label} className={`flex items-center gap-1.5 ${ok ? 'text-primary' : ''}`}>
                    <Check className={`h-3 w-3 ${ok ? 'opacity-100' : 'opacity-30'}`} />
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <Button type="submit" disabled={pending} className="w-full gap-2">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {pending ? 'Creating identity…' : 'Create Cirkle identity'}
          {!pending && <ArrowRight className="h-4 w-4" />}
        </Button>

        <p className="text-center text-[11px] text-muted-foreground">
          By creating an account you agree to the Cirkle Terms & Privacy Policy.
        </p>
      </form>
    </AuthShell>
  )
}
