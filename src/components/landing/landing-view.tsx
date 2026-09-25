'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  ShieldCheck,
  KeyRound,
  Fingerprint,
  Zap,
  Globe2,
  Lock,
  CheckCircle2,
  Users,
  AppWindow,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { CirkleLogo, CirkleMark } from '@/components/cirkle/logo'
import { ThemeToggle } from '@/components/cirkle/theme-toggle'
import { getAppIcon } from '@/components/cirkle/app-icons'
import { useAuthStore } from '@/stores/auth-store'
import { api, type EcosystemApp, type EcosystemStats } from '@/lib/api'

const FEATURES = [
  {
    icon: KeyRound,
    title: 'One identity, every app',
    description: 'Sign in once and reach every product in the Cirkle ecosystem — no per-app passwords, no repeated onboarding.',
  },
  {
    icon: ShieldCheck,
    title: 'Security by default',
    description: 'HttpOnly session cookies, hashed credentials, full audit trails, and per-app revocation give you real control.',
  },
  {
    icon: Fingerprint,
    title: 'Granular consent',
    description: 'Authorize each integration explicitly. Revoke access instantly. See exactly what each app can reach.',
  },
  {
    icon: Zap,
    title: 'Instant SSO handoff',
    description: 'OAuth-style redirect flow drops users straight into Cirkle-Search and the rest of the suite with zero friction.',
  },
  {
    icon: Globe2,
    title: 'Built for the ecosystem',
    description: 'Pre-wired for 18 Cirkle products spanning search, mail, finance, maritime, legal, and healthcare AI.',
  },
  {
    icon: Lock,
    title: 'Private by design',
    description: 'Your account lives at the center of the circle. Apps never see your password — only scoped tokens.',
  },
]

const STEPS = [
  {
    step: '01',
    title: 'Create your Cirkle identity',
    description: 'A single email and password unlocks the entire ecosystem. No per-app sign-ups, ever.',
  },
  {
    step: '02',
    title: 'Authorize the apps you use',
    description: 'Grant scoped access to Cirkle-Search, Mail, SuperApp and more — one click per app.',
  },
  {
    step: '03',
    title: 'Sign in everywhere',
    description: 'Every Cirkle product recognizes your Cirkle identity instantly. Revoke access any time.',
  },
]

export function LandingView() {
  const setView = useAuthStore((s) => s.setView)
  const user = useAuthStore((s) => s.user)
  const [apps, setApps] = useState<EcosystemApp[]>([])
  const [stats, setStats] = useState<EcosystemStats | null>(null)

  useEffect(() => {
    api.getApps().then((r) => setApps(r.apps)).catch(() => {})
    api.getStats().then(setStats).catch(() => {})
  }, [])

  const featured = apps.filter((a) => a.featured).slice(0, 6)
  const cirkleSearch = apps.find((a) => a.slug === 'cirkle-search')

  return (
    <div className="relative min-h-screen">
      {/* Cirkle signature backgrounds */}
      <div className="aurora-bg absolute inset-0 -z-10 opacity-70" />
      <div className="cirkle-grid absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <div className="arabesque absolute inset-0 -z-10 opacity-50 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />

      {/* Nav */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <CirkleLogo size={36} withWordmark withArabic />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <Button size="sm" onClick={() => setView('dashboard')} className="btn-gold gap-1.5 border-0">
                Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => setView('login')}>
                  Sign in
                </Button>
                <Button size="sm" onClick={() => setView('register')} className="btn-gold gap-1.5 border-0">
                  Get started <ArrowRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-5 inline-flex"
          >
            <span className="gold-stroke">
              <span className="signal-dot" />
              Unified identity for the Cirkle ecosystem
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mb-8 flex justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 -z-10 animate-pulse-ring rounded-full bg-primary/20 blur-2xl" />
              <CirkleMark size={96} className="drop-shadow-[0_8px_40px_hsl(39_45%_57%_/_0.4)]" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-6xl"
          >
            One identity. <span className="text-gradient-hero">Every Cirkle app.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="mx-auto mt-6 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg"
          >
            Cirkle Authentication is the single sign-on layer for the entire Cirkle
            ecosystem. Create <span className="font-medium text-foreground">one username</span> that
            connects your personal and business identities together — and reach every product,
            from <span className="font-medium text-foreground">Cirkle-Search</span> to finance,
            legal, and healthcare AI.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.26 }}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button size="lg" onClick={() => setView('register')} className="btn-gold w-full gap-2 border-0 sm:w-auto">
              Create your Cirkle identity
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => setView('login')} className="w-full sm:w-auto">
              Sign in
            </Button>
          </motion.div>

          {stats && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.34 }}
              className="mx-auto mt-10 flex max-w-md flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground"
            >
              <span className="inline-flex items-center gap-1.5">
                <AppWindow className="h-4 w-4 text-primary" />
                <strong className="font-semibold text-foreground">{stats.apps}</strong> connected apps
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Star className="h-4 w-4 text-primary" />
                <strong className="font-semibold text-foreground">{stats.featured}</strong> flagship products
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4 text-primary" />
                <strong className="font-semibold text-foreground">{Math.max(stats.users, 1)}</strong>+ members
              </span>
            </motion.div>
          )}
        </div>
      </section>

      {/* Cirkle-Search spotlight */}
      {cirkleSearch && (
        <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
          <Card className="orbit-ring relative overflow-hidden p-6 sm:p-10">
            <div className="cirkle-mesh absolute inset-0 -z-10 opacity-60" />
            <div className="grid items-center gap-8 lg:grid-cols-2">
              <div>
                <Badge variant="secondary" className="mb-4 gap-1.5">
                  <Star className="h-3 w-3 fill-current" /> Flagship integration
                </Badge>
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  Powered by Cirkle-Search
                </h2>
                <p className="mt-3 text-pretty text-muted-foreground">
                  Cirkle-Search is the discovery layer for the entire ecosystem. With
                  Cirkle Authentication, your single identity unlocks instant,
                  personalized search across every connected product — no extra logins,
                  no friction.
                </p>
                <ul className="mt-5 space-y-2.5 text-sm">
                  {[
                    'One-tap authorization to Cirkle-Search',
                    'Scoped access tokens — never your password',
                    'Revoke access instantly from your dashboard',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="text-foreground/90">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button onClick={() => setView('register')} className="btn-gold gap-1.5 border-0">
                    Get your Cirkle identity <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={cirkleSearch.homepage} target="_blank" rel="noreferrer">
                      Visit Cirkle-Search
                    </a>
                  </Button>
                </div>
              </div>
              <div className="relative">
                <div className="flex items-center gap-4 orbit-ring p-6">
                  <div
                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-white"
                    style={{ backgroundColor: cirkleSearch.color }}
                  >
                    {(() => {
                      const Icon = getAppIcon(cirkleSearch.icon)
                      return <Icon className="h-8 w-8" />
                    })()}
                  </div>
                  <div>
                    <div className="text-lg font-semibold">{cirkleSearch.name}</div>
                    <p className="mt-1 text-sm text-muted-foreground">{cirkleSearch.description}</p>
                    <div className="mt-2 gold-stroke">
                      <span className="signal-dot" /> Ready to integrate
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* Featured ecosystem apps */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
        <div className="mb-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              The Cirkle ecosystem
            </h2>
            <p className="mt-2 text-muted-foreground">
              One identity reaches every Cirkle product. Here are the flagships.
            </p>
          </div>
          {user && (
            <Button variant="outline" size="sm" onClick={() => setView('dashboard')}>
              Manage authorizations <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((app, i) => {
            const Icon = getAppIcon(app.icon)
            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Card className="orbit-ring group h-full p-5 transition-all hover:-translate-y-0.5">
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                      style={{ backgroundColor: app.color }}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-semibold">{app.name}</h3>
                        {app.authorized && (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                        )}
                      </div>
                      <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {app.category}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                    {app.description}
                  </p>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* Features grid */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Why Cirkle Authentication
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            A purpose-built identity layer for the Cirkle ecosystem — secure, scoped, and effortless.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
            >
              <Card className="orbit-ring h-full p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            How it works
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.step} className="relative">
              <div className="text-5xl font-bold text-primary/15">{s.step}</div>
              <h3 className="mt-2 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">
        <Card className="orbit-ring relative overflow-hidden p-8 text-center sm:p-14">
          <div className="cirkle-mesh absolute inset-0 -z-10 opacity-70" />
          <CirkleMark size={56} className="mx-auto mb-5" />
          <h2 className="mx-auto max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">
            Step into the circle. One identity opens every door.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Join the Cirkle ecosystem and reach Cirkle-Search, Mail, SuperApp and the rest
            with a single, secure sign-on.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" onClick={() => setView('register')} className="btn-gold w-full gap-2 border-0 sm:w-auto">
              Create your Cirkle identity <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => setView('login')} className="w-full sm:w-auto">
              I already have an account
            </Button>
          </div>
        </Card>
      </section>
    </div>
  )
}
