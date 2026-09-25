'use client'

import { useEffect, useState } from 'react'
import {
  Loader2,
  Building2,
  Plus,
  BadgeCheck,
  Trash2,
  CheckCircle2,
  Briefcase,
  Globe2,
  Hash,
  ArrowRight,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { api, type Business } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'

const TYPE_LABELS: Record<string, string> = {
  sole: 'Sole proprietor',
  llc: 'LLC',
  corp: 'Corporation',
  partnership: 'Partnership',
}

export function BusinessPanel() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const businesses = useAuthStore((s) => s.businesses)
  const setBusinesses = useAuthStore((s) => s.setBusinesses)
  const activeBusinessId = useAuthStore((s) => s.activeBusinessId)
  const setActiveBusinessId = useAuthStore((s) => s.setActiveBusinessId)
  const setDashboardTab = useAuthStore((s) => s.setDashboardTab)

  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Business | null>(null)
  const [creating, setCreating] = useState(false)

  // create form
  const [name, setName] = useState('')
  const [legalName, setLegalName] = useState('')
  const [taxId, setTaxId] = useState('')
  const [type, setType] = useState<'sole' | 'llc' | 'corp' | 'partnership'>('llc')
  const [country, setCountry] = useState('')
  const [industry, setIndustry] = useState('')

  async function load() {
    setLoading(true)
    try {
      const r = await api.getBusinesses()
      setBusinesses(r.businesses)
      if (r.businesses.length > 0 && !activeBusinessId) {
        setActiveBusinessId(r.businesses[0].id)
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load businesses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function create() {
    if (name.trim().length < 2) {
      toast.error('Business name is required')
      return
    }
    setCreating(true)
    try {
      const { business } = await api.createBusiness({
        name: name.trim(),
        legalName: legalName.trim() || undefined,
        taxId: taxId.trim() || undefined,
        type,
        country: country.trim() || undefined,
        industry: industry.trim() || undefined,
      })
      setBusinesses([business, ...businesses])
      setActiveBusinessId(business.id)
      setCreateOpen(false)
      setName(''); setLegalName(''); setTaxId(''); setCountry(''); setIndustry('')
      toast.success(`Business "${business.name}" created`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create business')
    } finally {
      setCreating(false)
    }
  }

  async function verify(b: Business) {
    try {
      const { business } = await api.updateBusiness(b.id, { verified: true })
      setBusinesses(businesses.map((x) => (x.id === b.id ? business : x)))
      if (user) setUser({ ...user, businessVerified: true })
      toast.success(`"${b.name}" is now verified`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to verify business')
    }
  }

  async function remove() {
    if (!deleteTarget) return
    try {
      await api.deleteBusiness(deleteTarget.id)
      const next = businesses.filter((x) => x.id !== deleteTarget.id)
      setBusinesses(next)
      if (activeBusinessId === deleteTarget.id) {
        setActiveBusinessId(next[0]?.id ?? null)
      }
      if (user && !next.some((b) => b.verified)) {
        setUser({ ...user, businessVerified: false })
      }
      toast.success(`"${deleteTarget.name}" removed`)
      setDeleteTarget(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete business')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Business profiles</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            One username ({user && <span className="font-medium text-foreground">@{user.username}</span>}) can manage personal and business identities together.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5">
              <Plus className="h-4 w-4" /> Add business
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add a business profile</DialogTitle>
              <DialogDescription>
                Link a business to your Cirkle identity. Verify it to unlock business-only platforms.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="b-name">Business name *</Label>
                <Input id="b-name" placeholder="Cirkle Holdings" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="b-legal">Legal name</Label>
                  <Input id="b-legal" placeholder="Cirkle Holdings LLC" value={legalName} onChange={(e) => setLegalName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="b-tax">Tax ID / Registration</Label>
                  <Input id="b-tax" placeholder="CIRK-2025-LLC" value={taxId} onChange={(e) => setTaxId(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="b-type">Type</Label>
                  <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                    <SelectTrigger id="b-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sole">Sole proprietor</SelectItem>
                      <SelectItem value="llc">LLC</SelectItem>
                      <SelectItem value="corp">Corporation</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="b-country">Country</Label>
                  <Input id="b-country" placeholder="Egypt" value={country} onChange={(e) => setCountry(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="b-industry">Industry</Label>
                  <Input id="b-industry" placeholder="Technology" value={industry} onChange={(e) => setIndustry(e.target.value)} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={create} disabled={creating} className="gap-1.5">
                {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                {creating ? 'Creating…' : 'Create business'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active context banner */}
      <Card className="flex flex-col items-start gap-4 border-primary/20 bg-gradient-to-br from-primary/8 via-card to-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Active context</p>
            <p className="font-semibold">
              {activeBusinessId ? businesses.find((b) => b.id === activeBusinessId)?.name : 'Personal'}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setDashboardTab('apps')} className="gap-1.5">
          Manage app authorizations <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </Card>

      {loading ? (
        <Card className="p-10 text-center">
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />
        </Card>
      ) : businesses.length === 0 ? (
        <Card className="p-8 text-center">
          <Building2 className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-3 font-semibold">No business profiles yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add a business to unlock SGTX, PPE Smart, MTQ Sigma, and Olymp-Ex.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {businesses.map((b) => {
            const active = b.id === activeBusinessId
            return (
              <Card key={b.id} className={`p-5 ${active ? 'border-primary/30 ring-1 ring-primary/20' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-semibold">{b.name}</h3>
                      {b.verified ? (
                        <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5 text-primary">
                          <BadgeCheck className="h-3 w-3" /> Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          Pending
                        </Badge>
                      )}
                      {active && (
                        <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5 text-primary">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      {b.legalName && <div className="flex items-center gap-1.5"><Briefcase className="h-3 w-3" /> {b.legalName}</div>}
                      {b.taxId && <div className="flex items-center gap-1.5"><Hash className="h-3 w-3" /> {b.taxId}</div>}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="inline-flex items-center gap-1.5"><Globe2 className="h-3 w-3" /> {b.country || '—'}</span>
                        <span>{TYPE_LABELS[b.type] ?? b.type}</span>
                        {b.industry && <span>· {b.industry}</span>}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  {!b.verified && (
                    <Button size="sm" variant="outline" onClick={() => verify(b)} className="gap-1.5">
                      <BadgeCheck className="h-3.5 w-3.5" /> Verify business
                    </Button>
                  )}
                  {!active && (
                    <Button size="sm" variant="ghost" onClick={() => setActiveBusinessId(b.id)}>
                      Set as active
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleteTarget(b)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes the business profile. App authorizations scoped to this business will need to be re-granted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); remove() }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove business
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
