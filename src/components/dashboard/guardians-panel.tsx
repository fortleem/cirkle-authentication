'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Plus,
  Trash2,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  KeyRound,
  Copy,
  Download,
  AlertTriangle,
  Sparkles,
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

interface GuardianRow {
  id: string
  label: string
  handle: string
  threshold: number
  total: number
  createdAt: string
}
interface GeneratedGuardian extends GuardianRow {
  share: string
}

export function GuardiansPanel() {
  const user = useAuthStore((s) => s.user)
  const [guardians, setGuardians] = useState<GuardianRow[]>([])
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const [generated, setGenerated] = useState<GeneratedGuardian[] | null>(null)
  const [threshold, setThreshold] = useState(2)
  const [drafts, setDrafts] = useState([{ label: '', handle: '' }, { label: '', handle: '' }])

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const r = await api.getRecoveryGuardians()
      setGuardians(r.guardians)
      if (r.guardians.length) setThreshold(r.guardians[0].threshold)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  function addDraft() {
    if (drafts.length >= 8) { toast.error('Max 8 guardians'); return }
    setDrafts([...drafts, { label: '', handle: '' }])
  }
  function updateDraft(i: number, field: 'label' | 'handle', value: string) {
    setDrafts(drafts.map((d, idx) => idx === i ? { ...d, [field]: value } : d))
  }
  function removeDraft(i: number) { setDrafts(drafts.filter((_, idx) => idx !== i)) }

  async function setup() {
    const valid = drafts.filter((d) => d.label.trim() && d.handle.trim())
    if (valid.length < 2) { toast.error('Add at least 2 guardians with labels + handles'); return }
    if (threshold > valid.length) { toast.error('Threshold cannot exceed guardian count'); return }
    setPending(true)
    try {
      const r = await api.setupRecovery(valid.map((g) => ({ label: g.label.trim(), handle: g.handle.trim() })), threshold)
      setGenerated(r.guardians)
      setDrafts([{ label: '', handle: '' }, { label: '', handle: '' }])
      await load()
      toast.success(`Recovery configured — ${r.total} guardians, threshold ${r.threshold}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Setup failed')
    } finally { setPending(false) }
  }

  async function teardown() {
    setPending(true)
    try {
      await api.teardownRecovery()
      setGuardians([])
      setGenerated(null)
      toast.success('Social recovery removed')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed')
    } finally { setPending(false) }
  }

  function copyShare(share: string) {
    navigator.clipboard.writeText(share).then(() => toast.success('Share copied'))
  }
  function downloadAll() {
    if (!generated) return
    const text = generated.map((g) => `Guardian: ${g.label} (${g.handle})\nShare: ${g.share}\n`).join('\n')
    const blob = new Blob([`Cirkle Social Recovery — Guardian Shares\nUser: @${user?.username}\nThreshold: ${threshold} of ${generated.length}\n\n${text}\nEach guardian gets ONE share. Distribute out-of-band (printed / offline).`], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `cirkle-guardian-shares-${user?.username}.txt`; a.click()
    URL.revokeObjectURL(url)
    toast.success('Shares downloaded')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">Social Recovery</h1>
          <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5 text-primary">
            <Sparkles className="h-2.5 w-2.5" /> Shamir's SSS · GF(256)
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Designate {guardians.length > 0 ? `${guardians[0].total}` : 'N'} trusted guardians. A recovery secret is split with real Shamir's Secret Sharing over GF(256) — any {guardians.length > 0 ? guardians[0].threshold : 'M'} of them can co-authorize your recovery. No single guardian holds enough to act alone.
        </p>
      </div>

      {/* Current config */}
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : guardians.length > 0 ? (
        <Card className="orbit-ring p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-medium">Active guardian configuration</h3>
            </div>
            <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5 text-primary">
              {guardians[0].threshold}-of-{guardians[0].total}
            </Badge>
          </div>
          <ul className="divide-y divide-border/50">
            {guardians.map((g) => (
              <li key={g.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Users className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{g.label}</p>
                  <p className="text-[11px] text-muted-foreground">{g.handle} · added {formatRelativeTime(g.createdAt)}</p>
                </div>
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-end">
            <Button size="sm" variant="outline" onClick={teardown} disabled={pending} className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" /> Remove recovery
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="orbit-ring flex flex-col items-center gap-2 p-8 text-center">
          <Users className="h-6 w-6 text-muted-foreground" />
          <h3 className="font-semibold">No guardians yet</h3>
          <p className="max-w-md text-sm text-muted-foreground">Set up M-of-N social recovery so trusted contacts can help you regain access if you ever lose everything — without any single one of them being able to act alone.</p>
        </Card>
      )}

      {/* Setup form */}
      {guardians.length === 0 && (
        <Card className="orbit-ring p-5">
          <div className="mb-4 flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium">Designate guardians</h3>
          </div>
          <div className="space-y-3">
            {drafts.map((d, i) => (
              <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor={`g-label-${i}`} className="text-xs">Guardian label</Label>
                  <Input id={`g-label-${i}`} placeholder="e.g. Sister" value={d.label} onChange={(e) => updateDraft(i, 'label', e.target.value)} />
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor={`g-handle-${i}`} className="text-xs">@username or email</Label>
                  <Input id={`g-handle-${i}`} placeholder="guardian@cirkle.app" value={d.handle} onChange={(e) => updateDraft(i, 'handle', e.target.value)} />
                </div>
                {drafts.length > 2 && (
                  <Button variant="ghost" size="icon" onClick={() => removeDraft(i)} className="text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={addDraft} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add guardian</Button>
            <div className="ml-auto flex items-center gap-2">
              <Label htmlFor="threshold" className="text-xs">Threshold (M)</Label>
              <Input id="threshold" type="number" min={2} max={8} value={threshold} onChange={(e) => setThreshold(Math.max(2, Math.min(8, Number(e.target.value))))} className="w-16 text-center" />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={setup} disabled={pending} className="btn-gold gap-2 border-0">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              {pending ? 'Splitting secret…' : 'Split secret & configure'}
            </Button>
          </div>
        </Card>
      )}

      {/* Generated shares (shown once) */}
      <AnimatePresence>
        {generated && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="orbit-ring border-amber-500/40 p-5">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-medium text-amber-600 dark:text-amber-400">Guardian shares — shown once</h3>
              </div>
              <p className="mb-3 text-xs text-amber-700 dark:text-amber-300">Each guardian receives exactly one share. Distribute them out-of-band (printed / offline password manager). The shares are not stored in plaintext anywhere after this view.</p>
              <ul className="space-y-2">
                {generated.map((g) => (
                  <li key={g.id} className="rounded-lg border border-border/50 bg-muted/20 p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium">{g.label}</span>
                      <span className="text-[10px] text-muted-foreground">{g.handle}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 truncate rounded bg-background/60 px-2 py-1 font-mono text-[10px]">{g.share}</code>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyShare(g.share)}><Copy className="h-3 w-3" /></Button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-end">
                <Button size="sm" variant="outline" onClick={downloadAll} className="gap-1.5"><Download className="h-3.5 w-3.5" /> Download all</Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
