'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Loader2,
  Search,
  CheckCircle2,
  ExternalLink,
  Plug,
  Unplug,
  Star,
  Clock,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { api, type EcosystemApp } from '@/lib/api'
import { getAppIcon } from '@/components/cirkle/app-icons'
import { RequirementBadges } from '@/components/cirkle/requirement-badges'
import { toast } from 'sonner'
import { formatRelativeTime } from '@/lib/format'
import { SsoConsentModal } from './sso-consent-modal'

export function AppsPanel() {
  const [apps, setApps] = useState<EcosystemApp[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'connected' | 'available' | 'featured'>('all')
  const [consentApp, setConsentApp] = useState<EcosystemApp | null>(null)
  const [revokeApp, setRevokeApp] = useState<EcosystemApp | null>(null)
  const [revoking, setRevoking] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const r = await api.getApps()
      setApps(r.apps)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load apps')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    return apps.filter((a) => {
      if (filter === 'connected' && !a.authorized) return false
      if (filter === 'available' && a.authorized) return false
      if (filter === 'featured' && !a.featured) return false
      if (query) {
        const q = query.toLowerCase()
        return (
          a.name.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [apps, filter, query])

  const connectedCount = apps.filter((a) => a.authorized).length

  async function confirmRevoke() {
    if (!revokeApp) return
    setRevoking(true)
    try {
      await api.revokeApp(revokeApp.id)
      setApps((prev) => prev.map((a) => (a.id === revokeApp.id ? { ...a, authorized: false, grantedAt: null, lastUsedAt: null } : a)))
      toast.success(`Access revoked for ${revokeApp.name}`)
      setRevokeApp(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to revoke access')
    } finally {
      setRevoking(false)
    }
  }

  function onAuthorized(app: EcosystemApp) {
    setApps((prev) => prev.map((a) => (a.id === app.id ? { ...a, authorized: true, grantedAt: new Date().toISOString() } : a)))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Connected apps</h1>
        <p className="text-sm text-muted-foreground">
          Authorize and manage every Cirkle product connected to your identity.
          You currently have <strong className="text-foreground">{connectedCount}</strong> app{connectedCount === 1 ? '' : 's'} connected.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search apps, categories…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All apps</SelectItem>
            <SelectItem value="connected">Connected</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="featured">Featured</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Apps grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-sm text-muted-foreground">No apps match your filters.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((app) => {
            const Icon = getAppIcon(app.icon)
            return (
              <Card
                key={app.id}
                className={`orbit-ring flex h-full flex-col p-5 transition-all hover:-translate-y-0.5 ${
                  app.authorized ? '' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                    style={{ backgroundColor: app.color }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="truncate font-semibold">{app.name}</h3>
                      {app.featured && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}
                    </div>
                    <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {app.category}
                    </p>
                  </div>
                  {app.authorized && (
                    <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5 text-primary">
                      <CheckCircle2 className="h-3 w-3" /> Connected
                    </Badge>
                  )}
                </div>

                <p className="mt-3 line-clamp-3 flex-1 text-sm text-muted-foreground">
                  {app.description}
                </p>

                {/* Dynamic per-platform auth requirements */}
                <RequirementBadges reqs={app.requirements} className="mt-3" />


                {app.authorized && (app.grantedAt || app.lastUsedAt) && (
                  <div className="mt-3 space-y-1 border-t border-border/40 pt-3 text-xs text-muted-foreground">
                    {app.grantedAt && (
                      <div className="flex items-center gap-1.5">
                        <Plug className="h-3 w-3" /> Connected {formatRelativeTime(app.grantedAt)}
                      </div>
                    )}
                    {app.lastUsedAt && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" /> Last used {formatRelativeTime(app.lastUsedAt)}
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4 flex items-center gap-2">
                  {app.authorized ? (
                    <>
                      <Button asChild size="sm" variant="outline" className="flex-1 gap-1.5">
                        <a href={app.redirectUrl || app.homepage} target="_blank" rel="noreferrer">
                          Open <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setRevokeApp(app)}
                      >
                        <Unplug className="h-3.5 w-3.5" /> Revoke
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      className="flex-1 gap-1.5"
                      onClick={() => setConsentApp(app)}
                    >
                      <Plug className="h-3.5 w-3.5" /> Authorize
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <SsoConsentModal
        app={consentApp}
        open={!!consentApp}
        onOpenChange={(v) => !v && setConsentApp(null)}
        onAuthorized={onAuthorized}
      />

      <AlertDialog open={!!revokeApp} onOpenChange={(v) => !v && !revoking && setRevokeApp(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke access to {revokeApp?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This app will lose access to your Cirkle identity immediately. You can re-authorize it any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                confirmRevoke()
              }}
              disabled={revoking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revoking ? 'Revoking…' : 'Revoke access'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
