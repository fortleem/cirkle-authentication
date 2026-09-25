import { cn } from '@/lib/utils'

interface CirkleLogoProps {
  className?: string
  size?: number
  withWordmark?: boolean
  wordmarkClassName?: string
}

/**
 * Cirkle logo — concentric rings forming a secure orbit, with a central node
 * representing the single identity at the center of the ecosystem.
 */
export function CirkleLogo({
  className,
  size = 40,
  withWordmark = false,
  wordmarkClassName,
}: CirkleLogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <CirkleMark size={size} />
      {withWordmark && (
        <div className={cn('flex flex-col leading-none', wordmarkClassName)}>
          <span className="font-semibold tracking-tight text-foreground">
            Cirkle
          </span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Authentication
          </span>
        </div>
      )}
    </div>
  )
}

export function CirkleMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="cirkle-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="oklch(0.72 0.15 160)" />
          <stop offset="0.55" stopColor="oklch(0.6 0.14 165)" />
          <stop offset="1" stopColor="oklch(0.5 0.1 175)" />
        </linearGradient>
        <radialGradient id="cirkle-core" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="oklch(0.95 0.05 160)" />
          <stop offset="1" stopColor="oklch(0.62 0.13 160)" />
        </radialGradient>
      </defs>
      {/* Outer orbit ring */}
      <circle cx="24" cy="24" r="21" stroke="url(#cirkle-grad)" strokeWidth="2" opacity="0.55" />
      {/* Middle ring (open C arc) */}
      <path
        d="M 35 24 A 11 11 0 1 1 24 13"
        stroke="url(#cirkle-grad)"
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Orbiting node */}
      <circle cx="24" cy="13" r="2.6" fill="url(#cirkle-grad)" />
      {/* Core */}
      <circle cx="24" cy="24" r="6" fill="url(#cirkle-core)" />
      <circle cx="24" cy="24" r="6" stroke="oklch(0.99 0.005 145)" strokeWidth="0.6" strokeOpacity="0.6" />
    </svg>
  )
}
