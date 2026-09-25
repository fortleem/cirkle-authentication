'use client'

import { create } from 'zustand'

export interface AuthUser {
  id: string
  username: string
  email: string
  name: string
  role: string
  twoFactorEnabled: boolean
  emailVerified: boolean
  phoneVerified: boolean
  kycVerified: boolean
  businessVerified: boolean
  phone: string | null
  avatarUrl: string | null
  createdAt: string
  lastLoginAt: string | null
}

export interface AppStats {
  connectedApps: number
  activeSessions: number
  auditEvents: number
  businesses: number
}

export interface Business {
  id: string
  name: string
  legalName: string | null
  taxId: string | null
  type: string
  country: string | null
  industry: string | null
  verified: boolean
  createdAt: string
}

export type View =
  | 'landing'
  | 'login'
  | 'register'
  | 'dashboard'

export type DashboardTab =
  | 'overview'
  | 'apps'
  | 'identity'
  | 'business'
  | 'security'
  | 'activity'

interface AuthState {
  user: AuthUser | null
  stats: AppStats | null
  businesses: Business[]
  activeBusinessId: string | null
  view: View
  dashboardTab: DashboardTab
  hydrated: boolean
  authLoading: boolean
  setView: (v: View) => void
  setDashboardTab: (t: DashboardTab) => void
  setUser: (u: AuthUser | null) => void
  setStats: (s: AppStats | null) => void
  setBusinesses: (b: Business[]) => void
  setActiveBusinessId: (id: string | null) => void
  setHydrated: (v: boolean) => void
  setAuthLoading: (v: boolean) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  stats: null,
  businesses: [],
  activeBusinessId: null,
  view: 'landing',
  dashboardTab: 'overview',
  hydrated: false,
  authLoading: false,
  setView: (v) => set({ view: v }),
  setDashboardTab: (t) => set({ dashboardTab: t }),
  setUser: (u) => set({ user: u }),
  setStats: (s) => set({ stats: s }),
  setBusinesses: (b) => set({ businesses: b }),
  setActiveBusinessId: (id) => set({ activeBusinessId: id }),
  setHydrated: (v) => set({ hydrated: v }),
  setAuthLoading: (v) => set({ authLoading: v }),
  reset: () => set({ user: null, stats: null, businesses: [], activeBusinessId: null, view: 'landing', dashboardTab: 'overview' }),
}))
