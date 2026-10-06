'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import {
  LayoutDashboard,
  Plug,
  ShieldCheck,
  Building2,
  Brain,
  UserCircle,
  Activity,
  Orbit,
  LogOut,
  Fingerprint,
  KeyRound,
  RefreshCw,
  ArrowRight,
  Search,
  Sparkles,
  Eye,
  BookOpen,
  Radar,
  Users,
} from 'lucide-react'
import { useAuthStore, type DashboardTab } from '@/stores/auth-store'
import { api } from '@/lib/api'
import { toast } from 'sonner'

/** Universal ⌘K command palette — fuzzy search across the whole identity. */
export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const businesses = useAuthStore((s) => s.businesses)
  const activeBusinessId = useAuthStore((s) => s.activeBusinessId)
  const setActiveBusinessId = useAuthStore((s) => s.setActiveBusinessId)
  const setDashboardTab = useAuthStore((s) => s.setDashboardTab)
  const setView = useAuthStore((s) => s.setView)
  const reset = useAuthStore((s) => s.reset)
  const [apps, setApps] = useState<{ id: string; name: string; slug: string; authorized: boolean }[]>([])

  useEffect(() => {
    if (open) {
      api.getApps().then((r) => setApps(r.apps.map((a) => ({ id: a.id, name: a.name, slug: a.slug, authorized: a.authorized })))).catch(() => {})
    }
  }, [open])

  function go(tab: DashboardTab) {
    setDashboardTab(tab)
    onOpenChange(false)
  }

  async function signOut() {
    onOpenChange(false)
    try {
      await api.logout()
      reset()
      toast.success('Signed out')
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to sign out')
    }
  }

  function switchContext(id: string | null, label: string) {
    setActiveBusinessId(id)
    toast.success(`Switched to ${label}`)
    setDashboardTab('overview')
    onOpenChange(false)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} className="orbit-ring">
      <CommandInput placeholder="Search Cirkle — jump, authorize, ask, switch…" />
      <CommandList>
        <CommandEmpty>No results — try "apps", "passkey", "brain", "sign out"…</CommandEmpty>

        {/* Navigation */}
        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => go('overview')} className="gap-2">
            <LayoutDashboard className="h-4 w-4 text-primary" /> Overview
            <CommandShortcut>dashboard</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go('constellation')} className="gap-2">
            <Orbit className="h-4 w-4 text-primary" /> Identity Constellation
            <CommandShortcut>breathtaking</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go('atlas')} className="gap-2">
            <BookOpen className="h-4 w-4 text-primary" /> Auth Atlas (methods × platforms)
            <CommandShortcut>catalog</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go('risk')} className="gap-2">
            <Radar className="h-4 w-4 text-primary" /> Risk Radar (adaptive scoring)
            <CommandShortcut>risk</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go('guardians')} className="gap-2">
            <Users className="h-4 w-4 text-primary" /> Guardians (M-of-N recovery)
            <CommandShortcut>shamir</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go('apps')} className="gap-2">
            <Plug className="h-4 w-4 text-primary" /> Connected apps
            <CommandShortcut>apps</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go('identity')} className="gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" /> Security Center
            <CommandShortcut>security</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go('business')} className="gap-2">
            <Building2 className="h-4 w-4 text-primary" /> Business profiles
            <CommandShortcut>business</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go('brain')} className="gap-2">
            <Brain className="h-4 w-4 text-primary" /> Circle Brain (AI consensus)
            <CommandShortcut>brain</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go('privacy')} className="gap-2">
            <Eye className="h-4 w-4 text-primary" /> Privacy Simulator
            <CommandShortcut>what can X see</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go('timeline')} className="gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Identity Timeline
            <CommandShortcut>journey</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go('security')} className="gap-2">
            <UserCircle className="h-4 w-4 text-primary" /> Sessions & credentials
            <CommandShortcut>sessions</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go('activity')} className="gap-2">
            <Activity className="h-4 w-4 text-primary" /> Activity & audit log
            <CommandShortcut>activity</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Context switch */}
        {businesses.length > 0 && (
          <CommandGroup heading="Switch identity context">
            <CommandItem onSelect={() => switchContext(null, 'Personal')} className="gap-2">
              <UserCircle className="h-4 w-4 text-primary" /> Personal
              {!activeBusinessId && <span className="ml-auto text-xs text-primary">active</span>}
            </CommandItem>
            {businesses.map((b) => (
              <CommandItem key={b.id} onSelect={() => switchContext(b.id, b.name)} className="gap-2">
                <Building2 className="h-4 w-4 text-primary" /> {b.name}
                {b.id === activeBusinessId && <span className="ml-auto text-xs text-primary">active</span>}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* Quick actions */}
        <CommandGroup heading="Quick actions">
          <CommandItem onSelect={() => { go('identity'); toast.info('Scroll to Passkeys to add one') }} className="gap-2">
            <Fingerprint className="h-4 w-4 text-primary" /> Add a passkey
            <CommandShortcut>passwordless</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => { go('identity'); toast.info('Scroll to Recovery codes to generate') }} className="gap-2">
            <KeyRound className="h-4 w-4 text-primary" /> Generate recovery codes
            <CommandShortcut>2FA fallback</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => { go('brain') }} className="gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Ask Circle Brain
            <CommandShortcut>AI consensus</CommandShortcut>
          </CommandItem>
          {user && (
            <CommandItem onSelect={signOut} className="gap-2">
              <LogOut className="h-4 w-4 text-destructive" /> <span className="text-destructive">Sign out</span>
              <CommandShortcut>@{user.username}</CommandShortcut>
            </CommandItem>
          )}
        </CommandGroup>

        <CommandSeparator />

        {/* Apps */}
        {apps.length > 0 && (
          <CommandGroup heading="Authorize an app">
            {apps.slice(0, 8).map((app) => (
              <CommandItem key={app.id} onSelect={() => { go('apps'); toast.info(`Search for ${app.name} to ${app.authorized ? 'revoke' : 'authorize'}`) }} className="gap-2">
                <div className={`h-2 w-2 rounded-full ${app.authorized ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                {app.name}
                {app.authorized && <span className="ml-auto text-[10px] text-primary">connected</span>}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* Home */}
        <CommandGroup heading="Cirkle">
          <CommandItem onSelect={() => { onOpenChange(false); setView('landing') }} className="gap-2">
            <Search className="h-4 w-4 text-primary" /> Back to landing
            <CommandShortcut>home</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
