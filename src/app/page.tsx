'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { api } from '@/lib/api'
import { LandingView } from '@/components/landing/landing-view'
import { LoginView } from '@/components/auth/login-view'
import { RegisterView } from '@/components/auth/register-view'
import { DashboardView } from '@/components/dashboard/dashboard-view'
import { Footer } from '@/components/cirkle/footer'
import { CirkleMark } from '@/components/cirkle/logo'

export default function Home() {
  const view = useAuthStore((s) => s.view)
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const setStats = useAuthStore((s) => s.setStats)
  const setView = useAuthStore((s) => s.setView)
  const hydrated = useAuthStore((s) => s.hydrated)
  const setHydrated = useAuthStore((s) => s.setHydrated)

  // Hydrate the auth state on mount
  useEffect(() => {
    let mounted = true
    api
      .getMe()
      .then((r) => {
        if (!mounted) return
        if (r) {
          setUser(r.user)
          setStats(r.stats)
          setView('dashboard')
        } else {
          setView('landing')
        }
      })
      .catch(() => {
        if (mounted) setView('landing')
      })
      .finally(() => {
        if (mounted) setHydrated(true)
      })
    return () => {
      mounted = false
    }
  }, [setUser, setStats, setView, setHydrated])

  if (!hydrated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 -z-10 animate-pulse-ring rounded-full bg-primary/30 blur-2xl" />
          <CirkleMark size={56} className="animate-spin-slow" />
        </div>
        <p className="text-sm text-muted-foreground">Loading Cirkle identity…</p>
      </div>
    )
  }

  if (view === 'dashboard' && user) {
    return <DashboardView />
  }
  if (view === 'login') {
    return <LoginView />
  }
  if (view === 'register') {
    return <RegisterView />
  }

  return (
    <div className="flex min-h-screen flex-col">
      <LandingView />
      <Footer />
    </div>
  )
}
