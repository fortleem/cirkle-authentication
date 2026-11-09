'use client'

import { useCallback } from 'react'
import { toast } from 'sonner'

/**
 * Notification API + security alerts — the latest 2026 browser technology.
 * Native OS-level notifications for critical security events (high risk,
 * lockdown, step-up). Users grant permission once, then receive alerts
 * even when the tab is in the background.
 *
 * Permission is read lazily (no setState-in-effect) to comply with
 * React 19's stricter effect rules.
 */
export function useSecurityNotifications() {
  const getPermission = useCallback((): NotificationPermission => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission
    }
    return 'unsupported' as NotificationPermission
  }, [])

  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast.info('This browser does not support notifications')
      return
    }
    const result = await Notification.requestPermission()
    if (result === 'granted') {
      toast.success('Security notifications enabled')
      new Notification('Cirkle Security Alerts', {
        body: 'You will now receive notifications for critical security events.',
        icon: '/logo.svg',
      })
    } else if (result === 'denied') {
      toast.warning('Notifications blocked — enable in browser settings')
    }
  }, [])

  const notify = useCallback((title: string, body: string, options?: NotificationOptions) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/logo.svg',
        badge: '/logo.svg',
        tag: 'cirkle-security',
        ...options,
      })
    }
  }, [])

  return { getPermission, requestPermission, notify }
}

// Pre-built security alert templates
export const SecurityAlerts = {
  highRisk: (score: number) => ({
    title: '⚠ High Risk Detected',
    body: `Your risk score reached ${score}/100. Step-up authentication may be required.`,
  }),
  lockdown: () => ({
    title: '🚨 Emergency Lockdown Activated',
    body: 'All sessions + app authorizations revoked. Sign-in is blocked until unlock.',
  }),
  stepUp: (app: string) => ({
    title: '🔐 Step-up Required',
    body: `Authorizing ${app} requires re-authentication (high-risk action).`,
  }),
  behavioralDeviation: (score: number) => ({
    title: '👁 Behavioral Pattern Deviation',
    body: `Your interaction pattern deviated by ${score.toFixed(1)}. If this is you, continue normally.`,
  }),
  sessionExpired: () => ({
    title: '⏱ Session Expired',
    body: 'Your risk-adaptive session has expired. Please sign in again.',
  }),
}
