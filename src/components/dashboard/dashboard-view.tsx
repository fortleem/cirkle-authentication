'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Plug,
  ShieldCheck,
  Activity,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { CirkleLogo } from '@/components/cirkle/logo'
import { ThemeToggle } from '@/components/cirkle/theme-toggle'
import { useAuthStore, type DashboardTab } from '@/stores/auth-store'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Footer } from '@/components/cirkle/footer'
import { OverviewPanel } from './overview-panel'
import { AppsPanel } from './apps-panel'
import { SecurityPanel } from './security-panel'
import { ActivityPanel } from './activity-panel'

const NAV: { key: DashboardTab; label: string; icon: typeof Plug; description: string }[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard, description: 'Your identity at a glance' },
  { key: 'apps', label: 'Connected apps', icon: Plug, description: 'Manage app authorizations' },
  { key: 'security', label: 'Security', icon: ShieldCheck, description: '2FA, sessions, credentials' },
  { key: 'activity', label: 'Activity', icon: Activity, description: 'Audit log of every event' },
]

export function DashboardView() {
  const user = useAuthStore((s) => s.user)
  const view = useAuthStore((s) => s.view)
  const dashboardTab = useAuthStore((s) => s.dashboardTab)
  const setDashboardTab = useAuthStore((s) => s.setDashboardTab)
  const setView = useAuthStore((s) => s.setView)
  const reset = useAuthStore((s) => s.reset)
  const router = useRouter()
  const [mobileNav, setMobileNav] = useState(false)

  // If somehow landed here without a user, bounce back to landing
  useEffect(() => {
    if (!user && view === 'dashboard') {
      setView('landing')
    }
  }, [user, view, setView])

  async function signOut() {
    try {
      await api.logout()
      reset()
      toast.success('Signed out')
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to sign out')
    }
  }

  if (!user) return null

  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || user.email[0]?.toUpperCase() || 'C'

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="cirkle-mesh absolute inset-0 -z-10 opacity-40" />

      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setView('landing')}>
              <CirkleLogo size={32} withWordmark />
            </button>
            <Badge variant="outline" className="hidden gap-1.5 border-primary/30 bg-primary/5 text-primary sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> SSO Dashboard
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={signOut} className="gap-1.5">
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
            <Avatar className="h-9 w-9 border border-border">
              <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileNav(true)}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6 lg:flex-row lg:gap-8">
        {/* Sidebar (desktop) */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <nav className="sticky top-24 space-y-1">
            {NAV.map((item) => {
              const active = dashboardTab === item.key
              return (
                <button
                  key={item.key}
                  onClick={() => setDashboardTab(item.key)}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                    active
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <item.icon className={`h-4 w-4 ${active ? 'text-primary' : ''}`} />
                  <span className="flex-1">{item.label}</span>
                  {active && <ChevronRight className="h-3.5 w-3.5" />}
                </button>
              )
            })}
            <div className="my-3 border-t border-border/60" />
            <div className="rounded-xl border border-border/60 bg-card/50 p-3">
              <p className="text-xs font-medium">Need help?</p>
              <p className="mt-1 text-xs text-muted-foreground">Manage everything from this dashboard.</p>
            </div>
          </nav>
        </aside>

        {/* Mobile nav drawer */}
        <AnimatePresence>
          {mobileNav && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-background/80 backdrop-blur lg:hidden"
                onClick={() => setMobileNav(false)}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r border-border bg-background p-4 lg:hidden"
              >
                <div className="mb-4 flex items-center justify-between">
                  <CirkleLogo size={28} withWordmark />
                  <Button variant="ghost" size="icon" onClick={() => setMobileNav(false)} aria-label="Close navigation">
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <nav className="space-y-1">
                  {NAV.map((item) => {
                    const active = dashboardTab === item.key
                    return (
                      <button
                        key={item.key}
                        onClick={() => {
                          setDashboardTab(item.key)
                          setMobileNav(false)
                        }}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm ${
                          active ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        <div className="flex-1">
                          <p>{item.label}</p>
                          <p className="text-[11px] text-muted-foreground">{item.description}</p>
                        </div>
                      </button>
                    )
                  })}
                </nav>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main content */}
        <main className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={dashboardTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {dashboardTab === 'overview' && <OverviewPanel />}
              {dashboardTab === 'apps' && <AppsPanel />}
              {dashboardTab === 'security' && <SecurityPanel />}
              {dashboardTab === 'activity' && <ActivityPanel />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <Footer />
    </div>
  )
}
