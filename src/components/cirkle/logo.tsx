import { cn } from '@/lib/utils'

interface CirkleLogoProps {
  className?: string
  size?: number
  withWordmark?: boolean
  wordmarkClassName?: string
  /** Show the Arabic دواير micro-subtitle under the wordmark */
  withArabic?: boolean
}

/**
 * Cirkle mark — three Arabic-inspired interlocking cirkles rotating 360°,
 * stroked with the brand gradient (gold → rose → teal) and anchored by a
 * central gradient core. Mirrors src/components/brand/CircleMark.tsx.
 */
export function CirkleLogo({
  className,
  size = 40,
  withWordmark = false,
  wordmarkClassName,
  withArabic = false,
}: CirkleLogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <CirkleMark size={size} />
      {withWordmark && (
        <div className={cn('flex flex-col leading-none', wordmarkClassName)}>
          <span className="font-display text-gradient-hero font-medium tracking-tight">
            Cirkle
          </span>
          {withArabic ? (
            <span
              dir="rtl"
              lang="ar"
              className="mt-0.5 text-[10px] text-muted-foreground"
              style={{ fontFamily: 'var(--font-tajawal), Tajawal, sans-serif', letterSpacing: 0 }}
            >
              دواير
            </span>
          ) : (
            <span className="mt-0.5 text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
              Authentication
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export function CirkleMark({
  size = 40,
  className,
}: {
  size?: number
  className?: string
}) {
  const gid = `cirkle-brand-${size}`
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('cirkle-spin-trefoil shrink-0', className)}
      style={{ transformOrigin: '50% 50%' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(var(--gold))" />
          <stop offset="50%" stopColor="hsl(var(--rose))" />
          <stop offset="100%" stopColor="hsl(var(--teal))" />
        </linearGradient>
      </defs>
      {/* Arabic-inspired interlocking cirkles */}
      <circle cx="50" cy="32" r="22" stroke={`url(#${gid})`} strokeWidth="1.5" opacity="0.9" />
      <circle cx="32" cy="60" r="22" stroke={`url(#${gid})`} strokeWidth="1.5" opacity="0.9" />
      <circle cx="68" cy="60" r="22" stroke={`url(#${gid})`} strokeWidth="1.5" opacity="0.9" />
      {/* Central gradient core */}
      <circle cx="50" cy="50" r="6" fill={`url(#${gid})`} />
    </svg>
  )
}
