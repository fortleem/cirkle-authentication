'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
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
  const setBusinesses = useAuthStore((s) => s.setBusinesses)
  const setActiveBusinessId = useAuthStore((s) => s.setActiveBusinessId)
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
          setBusinesses(r.businesses)
          if (r.businesses.length > 0) {
            setActiveBusinessId(r.businesses[0].id)
          }
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
  }, [setUser, setStats, setBusinesses, setActiveBusinessId, setView, setHydrated])

  if (!hydrated) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden bg-background">
        <div className="aurora-bg absolute inset-0 opacity-70" />
        <div className="arabesque absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        <motion.div
          initial={{ scale: 0.6, opacity: 0, filter: 'blur(20px)' }}
          animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <CirkleMark size={120} className="drop-shadow-[0_8px_50px_hsl(39_45%_57%_/_0.4)]" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="relative mt-2 text-center"
        >
          <div className="font-display text-4xl font-medium text-gradient-hero">Cirkle</div>
          <div
            dir="rtl"
            lang="ar"
            className="mt-1.5 text-[11px] tracking-[0.4em] text-muted-foreground"
            style={{ fontFamily: 'var(--font-tajawal), Tajawal, sans-serif' }}
          >
            دواير
          </div>
        </motion.div>
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
