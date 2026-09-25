'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CirkleLogo, CirkleMark } from '@/components/cirkle/logo'
import { ThemeToggle } from '@/components/cirkle/theme-toggle'
import { useAuthStore } from '@/stores/auth-store'

const BRAND_POINTS = [
  'One identity for every Cirkle app',
  'Scoped tokens, never your password',
  'Revoke any app in one click',
  'Full audit trail of every sign-in',
]

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}) {
  const setView = useAuthStore((s) => s.setView)

  return (
    <div className="relative min-h-screen lg:grid lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary/15 via-background to-background lg:flex lg:flex-col lg:justify-between lg:p-10">
        <div className="aurora-bg absolute inset-0 -z-10 opacity-80" />
        <div className="arabesque absolute inset-0 -z-10 opacity-60" />
        <div className="cirkle-grid absolute inset-0 -z-10 opacity-30 [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_70%)]" />
        <button
          onClick={() => setView('landing')}
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </button>

        <div className="relative mx-auto flex max-w-md flex-col items-center py-16 text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 -z-10 animate-pulse-ring rounded-full bg-primary/30 blur-3xl" />
            <CirkleMark size={96} className="drop-shadow-[0_8px_40px_hsl(39_45%_57%_/_0.4)]" />
          </div>
          <div className="mb-4">
            <div className="font-display text-4xl font-medium text-gradient-hero">Cirkle</div>
            <div
              dir="rtl"
              lang="ar"
              className="mt-1.5 text-[11px] tracking-[0.4em] text-muted-foreground"
              style={{ fontFamily: 'var(--font-tajawal), Tajawal, sans-serif' }}
            >
              دواير
            </div>
          </div>
          <h2 className="text-balance font-display text-2xl font-semibold tracking-tight">
            One identity opens every Cirkle app.
          </h2>
          <p className="mt-3 text-pretty text-sm text-muted-foreground">
            Cirkle Authentication is the single sign-on layer for the entire Cirkle
            ecosystem — built around Cirkle-Search and 17 more products.
          </p>
          <ul className="mt-8 w-full space-y-3 text-left">
            {BRAND_POINTS.map((p) => (
              <li key={p} className="orbit-ring flex items-center gap-3 px-4 py-3">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                <span className="text-sm">{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Cirkle</span>
          <span>OAuth 2.0 · OIDC · SOC2-aligned</span>
        </div>
      </div>

      {/* Right form panel */}
      <div className="relative flex min-h-screen flex-col">
        <div className="cirkle-mesh absolute inset-0 -z-10 opacity-50 lg:hidden" />
        <header className="flex items-center justify-between px-4 py-4 sm:px-8">
          <button onClick={() => setView('landing')}>
            <CirkleLogo size={32} withWordmark withArabic />
          </button>
          <ThemeToggle />
        </header>

        <div className="flex flex-1 items-center justify-center px-4 pb-8 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md"
          >
            <div className="mb-7">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            </div>
            {children}
            {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export function AuthPrimaryButton({
  children,
  pending,
  onClick,
  type = 'submit',
}: {
  children: ReactNode
  pending?: boolean
  onClick?: () => void
  type?: 'submit' | 'button'
}) {
  return (
    <Button type={type} onClick={onClick} disabled={pending} className="w-full gap-2">
      {children}
    </Button>
  )
}
