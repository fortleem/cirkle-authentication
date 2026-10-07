'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Filter,
  Loader2,
  BookOpen,
  Grid3x3,
  TrendingUp,
  CheckCircle2,
  Fingerprint,
  Sparkles,
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
import { api, type EcosystemApp } from '@/lib/api'
import { getAppIcon } from '@/components/cirkle/app-icons'
import {
  AUTH_METHODS,
  methodsForApp,
  categoryLabel,
  categoryColor,
  VERIFICATION_TIERS,
  type AuthCategory,
  type AuthMethod,
} from '@/lib/auth-catalog'
import { verificationLevelLabel, identityTypeLabel } from '@/lib/requirements'
import { statusLabel as qsLabel, statusColor as qsColor } from '@/lib/quantum-readiness'

export function AuthAtlasPanel() {
  const [apps, setApps] = useState<EcosystemApp[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<'all' | AuthCategory>('all')

  useEffect(() => {
    api.getApps().then((r) => setApps(r.apps)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filteredMethods = useMemo(
    () => (category === 'all' ? AUTH_METHODS : AUTH_METHODS.filter((m) => m.category === category)),
    [category],
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">Auth Atlas</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          The organized catalog of every authentication method in the Cirkle ecosystem — and exactly which methods each of the {apps.length || 18} platforms needs.
        </p>
      </div>

      {/* Section 1: Authentication methods catalog */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Fingerprint className="h-4 w-4 text-primary" />
            <h2 className="font-display text-lg font-semibold">Authentication methods</h2>
          </div>
          <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
            <SelectTrigger className="w-40 sm:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="identity">Identity</SelectItem>
              <SelectItem value="factor">Factors (2FA)</SelectItem>
              <SelectItem value="verification">Verification</SelectItem>
              <SelectItem value="authorization">Authorization</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredMethods.map((m, i) => (
            <MethodCard key={m.id} method={m} index={i} />
          ))}
        </div>
      </section>

      {/* Section 2: Per-platform auth matrix */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Grid3x3 className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-semibold">Per-platform auth matrix</h2>
          <Badge variant="secondary" className="ml-1">{apps.length}</Badge>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-3">
            {apps.map((app, i) => {
              const Icon = getAppIcon(app.icon)
              const methodIds = methodsForApp(app.requirements)
              const methods = methodIds
                .map((id) => AUTH_METHODS.find((m) => m.id === id))
                .filter(Boolean) as AuthMethod[]
              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 6 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.25, delay: Math.min(i * 0.02, 0.4) }}
                >
                  <Card className="orbit-ring flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
                    {/* App identity */}
                    <div className="flex items-center gap-3 lg:w-56 lg:shrink-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white" style={{ backgroundColor: app.color }}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{app.name}</p>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{app.category}</p>
                      </div>
                    </div>

                    {/* Requirement badges */}
                    <div className="flex flex-wrap items-center gap-1.5 lg:w-64 lg:shrink-0">
                      <Badge variant="outline" className="px-1.5 py-0 text-[10px]">{identityTypeLabel(app.requirements.identityType)}</Badge>
                      <Badge variant="outline" className={`px-1.5 py-0 text-[10px] ${app.requirements.verificationLevel === 'strict' ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400' : app.requirements.verificationLevel === 'enhanced' ? 'border-primary/30 bg-primary/5 text-primary' : 'text-muted-foreground'}`}>
                        {verificationLevelLabel(app.requirements.verificationLevel)}
                      </Badge>
                      {app.requirements.twoFactorRequired && <Badge variant="outline" className="gap-1 px-1.5 py-0 text-[10px] border-primary/30 bg-primary/5 text-primary"><Lock className="h-2.5 w-2.5" />2FA</Badge>}
                      {(app.requirements.businessRequired || app.requirements.identityType === 'business') && <Badge variant="outline" className="gap-1 px-1.5 py-0 text-[10px] border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">Business</Badge>}
                    </div>

                    {/* Methods needed */}
                    <div className="flex flex-1 flex-wrap items-center gap-1.5">
                      {methods.map((m) => (
                        <span key={m.id} className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] ${categoryColor(m.category)}`} title={m.summary}>
                          <m.icon className="h-2.5 w-2.5" />
                          {m.name.split(' ')[0]}
                        </span>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </section>

      {/* Section 3: Verification tier ladder */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-semibold">Verification tier ladder</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {VERIFICATION_TIERS.map((tier, i) => (
            <Card key={tier.name} className="orbit-ring relative overflow-hidden p-5">
              <div className="absolute right-3 top-3 font-display text-3xl font-bold opacity-10" style={{ color: tier.color }}>{i + 1}</div>
              <div className="mb-2 flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tier.color }} />
                <h3 className="font-display font-semibold" style={{ color: tier.color }}>{tier.name}</h3>
              </div>
              <ul className="mb-3 space-y-1 text-xs text-muted-foreground">
                {tier.includes.map((inc) => (
                  <li key={inc} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 shrink-0" style={{ color: tier.color }} /> {inc}
                  </li>
                ))}
              </ul>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Unlocks</p>
              <ul className="mt-1 space-y-0.5 text-xs">
                {tier.unlocks.map((app) => (
                  <li key={app} className="text-foreground/80">{app}</li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}

function MethodCard({ method, index }: { method: AuthMethod; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4) }}
    >
      <Card className="orbit-ring flex h-full flex-col p-5">
        <div className="mb-3 flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${categoryColor(method.category)}`}>
            <method.icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold">{method.name}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <Badge variant="outline" className={`px-1.5 py-0 text-[10px] ${categoryColor(method.category)}`}>
                {categoryLabel(method.category)}
              </Badge>
              <Badge variant="outline" className={`px-1.5 py-0 text-[10px] ${qsColor(method.quantumSafe)}`} title={`Quantum-readiness: ${qsLabel(method.quantumSafe)}`}>
                {qsLabel(method.quantumSafe)}
              </Badge>
            </div>
          </div>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">{method.summary}</p>

        {/* Security + UX profile */}
        <div className="mb-3 space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-20 shrink-0 text-muted-foreground">Security</span>
            <SecurityShields level={method.securityStrength} />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-20 shrink-0 text-muted-foreground">Phishing</span>
            {method.phishingResistant ? (
              <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5 text-primary"><ShieldCheck className="h-2.5 w-2.5" /> resistant</Badge>
            ) : (
              <Badge variant="outline" className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"><ShieldAlert className="h-2.5 w-2.5" /> vulnerable</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="w-20 shrink-0 text-muted-foreground">Experience</span>
            <Badge variant="outline" className={`px-1.5 py-0 text-[10px] ${method.ux === 'easy' ? 'border-primary/30 bg-primary/5 text-primary' : method.ux === 'moderate' ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
              {method.ux}
            </Badge>
          </div>
        </div>

        {/* Used for */}
        <div className="mt-auto flex flex-wrap gap-1.5">
          {method.usedFor.map((u) => (
            <span key={u} className="rounded-full bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">{u}</span>
          ))}
        </div>
      </Card>
    </motion.div>
  )
}

function SecurityShields({ level }: { level: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Shield
          key={i}
          className={`h-3.5 w-3.5 ${i < level ? 'fill-primary text-primary' : 'fill-muted text-muted-foreground/30'}`}
        />
      ))}
    </div>
  )
}
