'use client'

import { create } from 'zustand'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
  twoFactorEnabled: boolean
  emailVerified: boolean
  avatarUrl: string | null
  createdAt: string
  lastLoginAt: string | null
}

export interface AppStats {
  connectedApps: number
  activeSessions: number
  auditEvents: number
}

export type View =
  | 'landing'
  | 'login'
  | 'register'
  | 'dashboard'

export type DashboardTab =
  | 'overview'
  | 'apps'
  | 'security'
  | 'activity'

interface AuthState {
  user: AuthUser | null
  stats: AppStats | null
  view: View
  dashboardTab: DashboardTab
  hydrated: boolean
  authLoading: boolean
  setView: (v: View) => void
  setDashboardTab: (t: DashboardTab) => void
  setUser: (u: AuthUser | null) => void
  setStats: (s: AppStats | null) => void
  setHydrated: (v: boolean) => void
  setAuthLoading: (v: boolean) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  stats: null,
  view: 'landing',
  dashboardTab: 'overview',
  hydrated: false,
  authLoading: false,
  setView: (v) => set({ view: v }),
  setDashboardTab: (t) => set({ dashboardTab: t }),
  setUser: (u) => set({ user: u }),
  setStats: (s) => set({ stats: s }),
  setHydrated: (v) => set({ hydrated: v }),
  setAuthLoading: (v) => set({ authLoading: v }),
  reset: () => set({ user: null, stats: null, view: 'landing', dashboardTab: 'overview' }),
}))
