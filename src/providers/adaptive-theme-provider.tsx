'use client'

import { useEffect, createContext, useContext } from 'react'
import { useAuthStore } from '@/stores/auth-store'

type RiskTier = 'low' | 'elevated' | 'high' | 'locked'

const RiskTierContext = createContext<RiskTier>('low')
export const useRiskTier = () => useContext(RiskTierContext)

/**
 * Adaptive Risk-Based UI Theming — the dashboard's accent colors subtly
 * shift based on the user's security posture. Low risk = normal teal/gold.
 * Elevated = amber tints. High/locked = rose/red accents. The UI itself
 * communicates security state at a glance — passive, continuous, zero friction.
 */
export function AdaptiveThemeProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)

  const tier: RiskTier = !user
    ? 'low'
    : user.locked
      ? 'locked'
      : !user.twoFactorEnabled && !user.hasPasskey
        ? 'elevated'
        : 'low'

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('risk-low', 'risk-elevated', 'risk-high', 'risk-locked')
    root.classList.add(`risk-${tier}`)
  }, [tier])

  return <RiskTierContext.Provider value={tier}>{children}</RiskTierContext.Provider>
}
