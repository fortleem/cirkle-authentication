'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Database,
  Download,
  KeyRound,
  Plus,
  Trash2,
  Loader2,
  Copy,
  CheckCircle2,
  ShieldCheck,
  HardDrive,
  FileJson,
  AlertTriangle,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { formatRelativeTime } from '@/lib/format'

export function DatabasePanel() {
  const user = useAuthStore((s) => s.user)
  const stats = useAuthStore((s) => s.stats)
  const [keys, setKeys] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const [keyName, setKeyName] = useState('')
  const [keyScopes, setKeyScopes] = useState('identity:read')

  useEffect(() => { loadKeys() }, [])

  async function loadKeys() {
    setLoading(true)
    try {
      const res = await api.listApiKeys()
      setKeys(res.keys)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  async function downloadBackup() {
    setDownloading(true)
    try {
      const res = await fetch('/api/database/export')
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cirkle-auth-backup-${user?.username}-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Database backup downloaded')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Download failed')
    } finally { setDownloading(false) }
  }

  async function createKey() {
    if (!keyName.trim()) { toast.error('Enter a name'); return }
    setPending(true)
    try {
      const res = await api.createApiKey(keyName.trim(), keyScopes)
      setGeneratedKey(res.key)
      setKeyName('')
      await loadKeys()
      toast.success('API key generated — copy it now (shown once)')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed')
    } finally { setPending(false) }
  }

  async function revokeKey(id: string) {
    try {
      await api.revokeApiKey(id)
      setKeys(prev => prev.filter(k => k.id !== id))
      toast.success('API key revoked')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">Database & Developer</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Download a full backup of all authentication databases + manage API keys for programmatic access. Every auth method's data (passwords, passkeys, 2FA, recovery, social recovery, PQ attestation, sessions, audit, credentials) is exportable.
        </p>
      </div>

      {/* Database export */}
      <Card className="orbit-ring p-5">
        <div className="mb-4 flex items-center gap-2">
          <Download className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">Database backup</h3>
        </div>

        {/* Auth database table stats */}
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <DbStat icon={KeyRound} label="Sessions" value={stats?.activeSessions ?? 0} />
          <DbStat icon={ShieldCheck} label="Audit events" value={stats?.auditEvents ?? 0} />
          <DbStat icon={HardDrive} label="App access" value={stats?.connectedApps ?? 0} />
          <DbStat icon={FileJson} label="Businesses" value={stats?.businesses ?? 0} />
        </div>

        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-300">
          <AlertTriangle className="mb-1 inline h-3.5 w-3.5" /> The backup includes: user profile, sessions, passkeys (metadata only), guardians (metadata), credentials, app access, businesses, and the full Merkle audit chain. Secrets (passwordHash, recoveryCodesHash, PQ keys, guardian shares) are EXCLUDED for security.
        </div>

        <Button onClick={downloadBackup} disabled={downloading} className="btn-gold mt-3 gap-2 border-0">
          {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {downloading ? 'Exporting…' : 'Download full backup (.json)'}
        </Button>
      </Card>

      {/* API Keys */}
      <Card className="orbit-ring p-5">
        <div className="mb-4 flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">API Keys</h3>
          <span className="text-xs text-muted-foreground">— programmatic identity access</span>
        </div>

        {/* Generated key (shown once) */}
        <AnimatePresence>
          {generatedKey && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3"
            >
              <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5" /> Your API key — copy it now (shown once):
              </div>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 truncate rounded bg-background/60 px-2 py-1 font-mono text-xs">{generatedKey}</code>
                <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(generatedKey); toast.success('Copied') }}><Copy className="h-3 w-3" /></Button>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setGeneratedKey(null)} className="mt-2">Dismiss</Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create new key */}
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="key-name" className="text-xs">Key name</Label>
            <Input id="key-name" placeholder="e.g. Production API" value={keyName} onChange={(e) => setKeyName(e.target.value)} />
          </div>
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="key-scopes" className="text-xs">Scopes</Label>
            <Input id="key-scopes" placeholder="identity:read" value={keyScopes} onChange={(e) => setKeyScopes(e.target.value)} />
          </div>
          <Button onClick={createKey} disabled={pending} className="btn-gold gap-1.5 border-0">
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Generate
          </Button>
        </div>

        {/* Key list */}
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
        ) : keys.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No API keys yet. Generate one to access your identity programmatically.</p>
        ) : (
          <ul className="divide-y divide-border/50">
            {keys.map((k) => (
              <li key={k.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <KeyRound className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{k.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    <code className="font-mono">{k.prefix}…</code> · {k.scopes} · created {formatRelativeTime(k.createdAt)}
                    {k.lastUsedAt ? ` · used ${formatRelativeTime(k.lastUsedAt)}` : ' · never used'}
                  </p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => revokeKey(k.id)} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* API usage example */}
      <Card className="orbit-ring p-5">
        <div className="mb-3 flex items-center gap-2">
          <FileJson className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">Usage example</h3>
        </div>
        <pre className="overflow-x-auto rounded-lg border border-border/50 bg-muted/20 p-3 text-[11px] text-muted-foreground">
{`# Fetch your identity profile
curl -H "Authorization: Bearer cirk_sk_..." \\
  https://cirkle-auth.vercel.app/api/auth/me

# Download a full backup
curl -H "Authorization: Bearer cirk_sk_..." \\
  -o backup.json \\
  https://cirkle-auth.vercel.app/api/database/export`}
        </pre>
      </Card>
    </div>
  )
}

function DbStat({ icon: Icon, label, value }: { icon: typeof KeyRound; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 p-2.5">
      <Icon className="h-3.5 w-3.5 text-primary" />
      <div>
        <p className="text-sm font-semibold tabular-nums">{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}
