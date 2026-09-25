'use client'

import { useEffect, useState } from 'react'
import {
  Loader2,
  ShieldCheck,
  Smartphone,
  Monitor,
  Trash2,
  LogOut,
  KeyRound,
  Mail,
  User,
  CheckCircle2,
  Lock,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { api, type SessionInfo } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { formatRelativeTime, formatDateTime, parseUserAgent } from '@/lib/format'

export function SecurityPanel() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling2fa, setToggling2fa] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  async function loadSessions() {
    setLoading(true)
    try {
      const r = await api.getSessions()
      setSessions(r.sessions)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()
  }, [])

  async function toggle2FA(checked: boolean) {
    setToggling2fa(true)
    try {
      await api.toggle2FA(checked)
      setUser(user ? { ...user, twoFactorEnabled: checked } : user)
      toast.success(checked ? 'Two-factor authentication enabled' : 'Two-factor authentication disabled')
    } catch (e) {
      toast.error(e instanceof Error ? errMessage(e, checked) : 'Failed to update 2FA')
    } finally {
      setToggling2fa(false)
    }
  }

  async function revokeSession(id: string) {
    setRevokingId(id)
    try {
      await api.deleteSession(id)
      setSessions((prev) => prev.filter((s) => s.id !== id))
      toast.success('Session signed out')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to revoke session')
    } finally {
      setRevokingId(null)
    }
  }

  async function revokeAll() {
    try {
      await api.revokeAllSessions()
      await loadSessions()
      toast.success('All other sessions signed out')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to revoke sessions')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Security</h1>
        <p className="text-sm text-muted-foreground">
          Protect your Cirkle identity. Manage two-factor auth, active sessions, and credentials.
        </p>
      </div>

      {/* Account credentials */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Account credentials</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="h-3.5 w-3.5" /> Email
            </div>
            <p className="mt-1 truncate text-sm font-medium">{user?.email}</p>
            <div className="mt-2 inline-flex items-center gap-1 text-xs text-primary">
              <CheckCircle2 className="h-3 w-3" /> Verified
            </div>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="h-3.5 w-3.5" /> Display name
            </div>
            <p className="mt-1 truncate text-sm font-medium">{user?.name}</p>
            <p className="mt-2 text-xs text-muted-foreground">Visible to authorized apps</p>
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-border/60 bg-muted/20 p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" /> Password
          </div>
          <p className="mt-1 text-sm font-medium">••••••••••••</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => toast.info('Password change is not enabled in this preview')}
          >
            Change password
          </Button>
        </div>
      </Card>

      {/* Two-factor auth */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Two-factor authentication</h3>
          {user?.twoFactorEnabled && (
            <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5 text-primary">
              Enabled
            </Badge>
          )}
        </div>
        <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-border/60 bg-muted/20 p-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Smartphone className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium">Authenticator app</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Require a one-time code in addition to your password.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="2fa" className="sr-only">Two-factor</Label>
            <Switch
              id="2fa"
              checked={!!user?.twoFactorEnabled}
              disabled={toggling2fa}
              onCheckedChange={toggle2FA}
            />
          </div>
        </div>
      </Card>

      {/* Active sessions */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Active sessions</h3>
            <Badge variant="secondary">{sessions.length}</Badge>
          </div>
          {sessions.length > 1 && (
            <Button variant="outline" size="sm" onClick={revokeAll} className="gap-1.5">
              <LogOut className="h-3.5 w-3.5" /> Sign out all others
            </Button>
          )}
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">No active sessions.</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {sessions.map((s) => {
              const meta = parseUserAgent(s.userAgent)
              return (
                <li key={s.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Monitor className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        {meta.browser} · {meta.os}
                      </p>
                      {s.current && (
                        <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">This device</Badge>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {s.ip} · Active {formatRelativeTime(s.createdAt)} · Expires {formatDateTime(s.expiresAt)}
                    </p>
                  </div>
                  {!s.current && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => revokeSession(s.id)}
                      disabled={revokingId === s.id}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      {revokingId === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      <span className="ml-1">Revoke</span>
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}

function errMessage(_e: unknown, _checked: boolean) {
  return 'Failed to update 2FA'
}
