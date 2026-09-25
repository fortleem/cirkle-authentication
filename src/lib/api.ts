import type { AuthUser, AppStats, Business } from '@/stores/auth-store'

export interface AppRequirements {
  identityType: 'personal' | 'business' | 'either'
  verificationLevel: 'basic' | 'enhanced' | 'strict'
  twoFactorRequired: boolean
  businessRequired: boolean
  requiredScopes: string
}

export interface RequirementCheck {
  key: 'email' | 'phone' | 'kyc' | 'twoFactor' | 'business'
  label: string
  description: string
  met: boolean
}

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
  contextType: 'personal' | 'business' | null
  businessId: string | null
  requirements: AppRequirements
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

export interface AuthorizeResponse {
  ok: true
  redirectUrl: string | null
  app: { id: string; name: string; slug: string; homepage: string }
  contextType: 'personal' | 'business'
  businessId: string | null
}

export interface AuthorizeRequirementsMissing {
  error: string
  requirements: RequirementCheck[]
  missing?: RequirementCheck[]
  missingBusiness?: boolean
}

async function parseResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({ error: 'Invalid server response' }))
  if (!res.ok) {
    throw new ApiError((data as { error?: string }).error ?? `Request failed (${res.status})`, data, res.status)
  }
  return data as T
}

export class ApiError extends Error {
  data: unknown
  status: number
  constructor(message: string, data: unknown, status: number) {
    super(message)
    this.name = 'ApiError'
    this.data = data
    this.status = status
  }
}

export function isRequirementsMissing(e: unknown): e is ApiError & { data: AuthorizeRequirementsMissing } {
  return e instanceof ApiError && e.status === 422
}

export const api = {
  async getMe(): Promise<{ user: AuthUser; stats: AppStats; businesses: Business[] } | null> {
    const res = await fetch('/api/auth/me', { cache: 'no-store' })
    if (res.status === 401) return null
    return parseResponse(res)
  },

  async register(input: { name: string; username: string; email: string; password: string }): Promise<{ user: AuthUser }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    return parseResponse(res)
  },

  async login(input: { identifier: string; password: string }): Promise<{ user: AuthUser }> {
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

  async authorizeApp(appId: string, opts?: { scopes?: string; businessId?: string; contextType?: 'personal' | 'business' }): Promise<AuthorizeResponse> {
    const res = await fetch(`/api/apps/${appId}/authorize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(opts ?? {}),
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

  // Businesses
  async getBusinesses(): Promise<{ businesses: Business[] }> {
    const res = await fetch('/api/businesses', { cache: 'no-store' })
    return parseResponse(res)
  },
  async createBusiness(input: { name: string; legalName?: string; taxId?: string; type: 'sole' | 'llc' | 'corp' | 'partnership'; country?: string; industry?: string }): Promise<{ business: Business }> {
    const res = await fetch('/api/businesses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    return parseResponse(res)
  },
  async updateBusiness(id: string, input: Partial<{ name: string; legalName: string; taxId: string; type: 'sole' | 'llc' | 'corp' | 'partnership'; country: string; industry: string; verified: boolean }>): Promise<{ business: Business }> {
    const res = await fetch(`/api/businesses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    return parseResponse(res)
  },
  async deleteBusiness(id: string): Promise<{ ok: boolean }> {
    const res = await fetch(`/api/businesses/${id}`, { method: 'DELETE' })
    return parseResponse(res)
  },

  // Verification
  async verifyPhone(phone: string): Promise<{ ok: boolean; phone: string; phoneVerified: boolean }> {
    const res = await fetch('/api/verification/phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    })
    return parseResponse(res)
  },
  async startKyc(): Promise<{ ok: boolean; token: string; message: string }> {
    const res = await fetch('/api/verification/kyc', { method: 'POST' })
    return parseResponse(res)
  },
  async completeKyc(): Promise<{ ok: boolean; kycVerified: boolean }> {
    const res = await fetch('/api/verification/kyc', { method: 'PATCH' })
    return parseResponse(res)
  },
}
