import type { AuthUser, AppStats } from '@/stores/auth-store'

export interface EcosystemApp {
  id: string
  slug: string
  name: string
  description: string
  category: string
  color: string
  icon: string
  homepage: string
  redirectUrl: string | null
  featured: boolean
  status: string
  authorized: boolean
  grantedAt: string | null
  lastUsedAt: string | null
  scopes: string | null
}

export interface SessionInfo {
  id: string
  ip: string | null
  userAgent: string | null
  createdAt: string
  expiresAt: string
  current: boolean
}

export interface AuditEntry {
  id: string
  action: string
  ip: string | null
  userAgent: string | null
  metadata: unknown
  createdAt: string
}

export interface EcosystemStats {
  apps: number
  users: number
  appsActive: number
  featured: number
  categories: { category: string; count: number }[]
}

async function parseResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({ error: 'Invalid server response' }))
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? `Request failed (${res.status})`)
  }
  return data as T
}

export const api = {
  async getMe(): Promise<{ user: AuthUser; stats: AppStats } | null> {
    const res = await fetch('/api/auth/me', { cache: 'no-store' })
    if (res.status === 401) return null
    return parseResponse(res)
  },

  async register(input: { name: string; email: string; password: string }): Promise<{ user: AuthUser }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    return parseResponse(res)
  },

  async login(input: { email: string; password: string }): Promise<{ user: AuthUser }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    return parseResponse(res)
  },

  async logout(): Promise<{ ok: boolean }> {
    const res = await fetch('/api/auth/logout', { method: 'POST' })
    return parseResponse(res)
  },

  async getApps(): Promise<{ apps: EcosystemApp[]; authenticated: boolean }> {
    const res = await fetch('/api/apps', { cache: 'no-store' })
    return parseResponse(res)
  },

  async authorizeApp(appId: string, scopes?: string): Promise<{ ok: boolean; redirectUrl: string | null; app: { id: string; name: string; slug: string; homepage: string } }> {
    const res = await fetch(`/api/apps/${appId}/authorize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scopes }),
    })
    return parseResponse(res)
  },

  async revokeApp(appId: string): Promise<{ ok: boolean }> {
    const res = await fetch(`/api/apps/${appId}/revoke`, { method: 'DELETE' })
    return parseResponse(res)
  },

  async getSessions(): Promise<{ sessions: SessionInfo[] }> {
    const res = await fetch('/api/sessions', { cache: 'no-store' })
    return parseResponse(res)
  },

  async deleteSession(id: string): Promise<{ ok: boolean }> {
    const res = await fetch(`/api/sessions/${id}`, { method: 'DELETE' })
    return parseResponse(res)
  },

  async revokeAllSessions(): Promise<{ ok: boolean }> {
    const res = await fetch('/api/sessions', { method: 'DELETE' })
    return parseResponse(res)
  },

  async getAudit(): Promise<{ logs: AuditEntry[] }> {
    const res = await fetch('/api/audit', { cache: 'no-store' })
    return parseResponse(res)
  },

  async getStats(): Promise<EcosystemStats> {
    const res = await fetch('/api/stats', { cache: 'no-store' })
    return parseResponse(res)
  },

  async toggle2FA(enabled: boolean): Promise<{ ok: boolean; twoFactorEnabled: boolean }> {
    const res = await fetch('/api/2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    })
    return parseResponse(res)
  },
}
