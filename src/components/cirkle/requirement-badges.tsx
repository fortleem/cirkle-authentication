'use client'

import { ShieldCheck, KeyRound, Fingerprint, Building2, Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { AppRequirements } from '@/lib/api'
import { verificationLevelLabel, identityTypeLabel } from '@/lib/requirements'

export function RequirementBadges({ reqs, className }: { reqs: AppRequirements; className?: string }) {
  const items: { icon: typeof ShieldCheck; label: string; tone: string }[] = []
  if (reqs.businessRequired || reqs.identityType === 'business') {
    items.push({ icon: Building2, label: 'Business', tone: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400' })
  }
  if (reqs.verificationLevel === 'basic') {
    items.push({ icon: Fingerprint, label: 'Email', tone: 'border-border bg-muted/40 text-muted-foreground' })
  } else if (reqs.verificationLevel === 'enhanced') {
    items.push({ icon: Fingerprint, label: 'Email + Phone', tone: 'border-border bg-muted/40 text-muted-foreground' })
  } else if (reqs.verificationLevel === 'strict') {
    items.push({ icon: ShieldCheck, label: 'KYC', tone: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400' })
  }
  if (reqs.twoFactorRequired) {
    items.push({ icon: Lock, label: '2FA', tone: 'border-primary/30 bg-primary/5 text-primary' })
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      <Badge variant="outline" className="gap-1 px-1.5 py-0 text-[10px] font-medium">
        <KeyRound className="h-2.5 w-2.5" />
        {identityTypeLabel(reqs.identityType)}
      </Badge>
      {items.map((it, i) => (
        <Badge key={i} variant="outline" className={`gap-1 px-1.5 py-0 text-[10px] font-medium ${it.tone}`}>
          <it.icon className="h-2.5 w-2.5" />
          {it.label}
        </Badge>
      ))}
      <Badge variant="outline" className="px-1.5 py-0 text-[10px] text-muted-foreground">
        {verificationLevelLabel(reqs.verificationLevel)}
      </Badge>
    </div>
  )
}
