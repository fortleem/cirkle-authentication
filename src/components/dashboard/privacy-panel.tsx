'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Eye,
  EyeOff,
  ShieldCheck,
  Loader2,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Globe2,
  Building2,
  Plug,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { api, type EcosystemApp } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { computeVisibility, PUBLIC_VISIBILITY, visibilityGrade, recommendationsFor } from '@/lib/privacy'
import { PostureGauge } from '@/components/cirkle/posture-gauge'

interface Viewer {
  id: string
  name: string
  type: 'public' | 'business' | 'app'
  icon: typeof Globe2
  scopes: string[]
  appId?: string
}

export function PrivacyPanel() {
  const user = useAuthStore((s) => s.user)
  const businesses = useAuthStore((s) => s.businesses)
  const setDashboardTab = useAuthStore((s) => s.setDashboardTab)
  const [apps, setApps] = useState<EcosystemApp[]>([])
  const [loading, setLoading] = useState(true)
  const [viewerId, setViewerId] = useState('public')

  useEffect(() => {
    api.getApps().then((r) => setApps(r.apps)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const viewers: Viewer[] = useMemo(() => {
    const list: Viewer[] = [
      { id: 'public', name: 'The public (no sign-in)', type: 'public', icon: Globe2, scopes: ['openid', 'profile'] },
    ]
    for (const b of businesses) {
      list.push({ id: `biz-${b.id}`, name: `${b.name} (business)`, type: 'business', icon: Building2, scopes: ['openid', 'profile', 'email', 'business.read'] })
    }
    for (const a of apps) {
      if (a.authorized) {
        list.push({ id: `app-${a.id}`, name: a.name, type: 'app', icon: Plug, scopes: (a.scopes || a.requirements.requiredScopes).split(' '), appId: a.id })
      }
    }
    return list
  }, [apps, businesses])

  const current = viewers.find((v) => v.id === viewerId) ?? viewers[0]
  const visibility = useMemo(() => {
    if (current?.type === 'public') {
      // Public only sees the public fields
      return { visibleFields: PUBLIC_VISIBILITY, hiddenFields: [], score: 4, scopeList: current.scopes }
    }
    return computeVisibility(current?.scopes ?? [])
  }, [current])

  const grade = visibilityGrade(visibility.score)
  const recs = current?.type === 'app' ? recommendationsFor(visibility.visibleFields, current.name) : []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">Privacy Simulator</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Pick any viewer and see <strong>exactly</strong> what data it can access through your Cirkle identity. A 0–100 visibility score + prescriptive recommendations — transparency no competitor offers.
        </p>
      </div>

      {/* Viewer picker */}
      <Card className="orbit-ring p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Who is looking?</label>
            {loading ? (
              <div className="flex h-10 items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading viewers…
              </div>
            ) : (
              <Select value={viewerId} onValueChange={setViewerId}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {viewers.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      <span className="flex items-center gap-2">
                        <v.icon className="h-3.5 w-3.5" /> {v.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          {current?.type === 'app' && (
            <Button variant="outline" size="sm" onClick={() => setDashboardTab('apps')} className="gap-1.5">
              Manage this app's access <Plug className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </Card>

      <AnimatePresence mode="wait">
        {current && (
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="grid gap-4 lg:grid-cols-3"
          >
            {/* Score gauge */}
            <Card className="orbit-ring relative flex flex-col items-center justify-center overflow-hidden p-6">
              <div className="aurora-bg absolute inset-0 -z-10 opacity-40" />
              <div className="mb-2 flex items-center gap-2">
                <current.icon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{current.name}</span>
              </div>
              <PostureGauge score={visibility.score} total={100} label="visibility" size={160} />
              <Badge variant="outline" className="mt-3 gap-1.5 border-border" style={{ color: grade.color }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: grade.color }} />
                {grade.label}
              </Badge>
            </Card>

            {/* Visible fields */}
            <Card className="orbit-ring p-5">
              <div className="mb-3 flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-medium">Can see</h3>
                <Badge variant="secondary" className="ml-auto">{visibility.visibleFields.length}</Badge>
              </div>
              <ul className="space-y-1.5">
                {visibility.visibleFields.length === 0 ? (
                  <li className="text-xs text-muted-foreground">Nothing — this viewer sees no data.</li>
                ) : (
                  visibility.visibleFields.map((f) => (
                    <li key={f.key} className="flex items-center gap-2 rounded-lg bg-muted/20 px-2.5 py-1.5 text-sm">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="flex-1">{f.label}</span>
                      <SensitivityDots level={f.sensitivity} />
                    </li>
                  ))
                )}
              </ul>
            </Card>

            {/* Hidden fields */}
            <Card className="orbit-ring p-5">
              <div className="mb-3 flex items-center gap-2">
                <EyeOff className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Cannot see</h3>
                <Badge variant="secondary" className="ml-auto">{visibility.hiddenFields.length}</Badge>
              </div>
              <ul className="max-h-64 space-y-1.5 overflow-y-auto cirkle-scroll">
                {visibility.hiddenFields.map((f) => (
                  <li key={f.key} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground">
                    <div className="h-3.5 w-3.5 shrink-0 rounded-full border border-muted-foreground/30" />
                    <span className="flex-1">{f.label}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recommendations */}
      {recs.length > 0 && (
        <Card className="orbit-ring p-5">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium">Prescriptive recommendations</h3>
          </div>
          <ul className="space-y-2">
            {recs.map((r, i) => {
              const isWarning = r.includes('Revoke')
              return (
                <li key={i} className={`flex items-start gap-2 rounded-lg p-3 text-sm ${isWarning ? 'border border-amber-500/30 bg-amber-500/5' : 'border border-border/50 bg-muted/20'}`}>
                  {isWarning ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" /> : <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
                  <span>{r}</span>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Visibility score = (sensitivity-weighted data the viewer can access) ÷ (total possible). Lower = more private.
      </p>
    </div>
  )
}

function SensitivityDots({ level }: { level: number }) {
  const dots = Math.ceil(level / 2) // 1-5 dots
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${i < dots ? 'bg-primary' : 'bg-muted-foreground/20'}`}
        />
      ))}
    </div>
  )
}
