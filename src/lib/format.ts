export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return '—'
  const diff = Date.now() - d.getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 5) return 'just now'
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}d ago`
  const wk = Math.floor(day / 7)
  if (wk < 5) return `${wk}w ago`
  const mo = Math.floor(day / 30)
  if (mo < 12) return `${mo}mo ago`
  const yr = Math.floor(day / 365)
  return `${yr}y ago`
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function parseUserAgent(ua: string | null | undefined): { browser: string; os: string; device: string } {
  if (!ua) return { browser: 'Unknown', os: 'Unknown', device: 'Unknown' }
  let browser = 'Unknown'
  let os = 'Unknown'
  let device = 'Desktop'

  if (/edg/i.test(ua)) browser = 'Edge'
  else if (/chrome/i.test(ua) && !/chromium/i.test(ua)) browser = 'Chrome'
  else if (/firefox/i.test(ua)) browser = 'Firefox'
  else if (/safari/i.test(ua)) browser = 'Safari'

  if (/windows/i.test(ua)) os = 'Windows'
  else if (/mac os/i.test(ua)) os = 'macOS'
  else if (/android/i.test(ua)) os = 'Android'
  else if (/iphone|ipad|ios/i.test(ua)) os = 'iOS'
  else if (/linux/i.test(ua)) os = 'Linux'

  if (/iphone|ipad|ios/i.test(ua)) device = 'iPhone/iPad'
  else if (/android/i.test(ua)) device = 'Android'
  else if (/mobile/i.test(ua)) device = 'Mobile'

  return { browser, os, device }
}

export function formatActionLabel(action: string): string {
  const map: Record<string, string> = {
    'user.registered': 'Account created',
    'session.login': 'Signed in',
    'session.logout': 'Signed out',
    'app.authorized': 'Authorized app',
    'app.revoked': 'Revoked app access',
    '2fa.enabled': 'Two-factor enabled',
    '2fa.disabled': 'Two-factor disabled',
  }
  return map[action] ?? action.replace(/\./g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
