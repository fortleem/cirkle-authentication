import { cn } from '@/lib/utils'

interface CirkleLogoProps {
  className?: string
  size?: number
  withWordmark?: boolean
  wordmarkClassName?: string
}

/**
 * Cirkle logo — three golden circles rotating 360° around a central identity core.
 * The trefoil of interlocking rings represents the unified Cirkle identity
 * reaching personal, business, and the wider ecosystem from a single point.
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
  // Unique gradient ids so multiple marks on one page don't clash
  const gid = `cirkle-gold-${size}`
  const cid = `cirkle-core-${size}`
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
        <linearGradient id={gid} x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f6d365" />
          <stop offset="0.5" stopColor="#d4a017" />
          <stop offset="1" stopColor="#a06d0c" />
        </linearGradient>
        <radialGradient id={cid} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="1" stopColor="#c9941a" />
        </radialGradient>
      </defs>

      {/* Outer golden ring (the Cirkle boundary) */}
      <circle cx="24" cy="24" r="22" stroke={`url(#${gid})`} strokeWidth="1" opacity="0.4" />

      {/* Three interlocking golden circles rotating 360° */}
      <g
        className="cirkle-spin-trefoil"
        style={{ transformOrigin: '24px 24px' }}
      >
        {/* top */}
        <circle cx="24" cy="17.5" r="9" stroke={`url(#${gid})`} strokeWidth="2.6" opacity="0.95" />
        {/* bottom-left */}
        <circle cx="18.4" cy="27.5" r="9" stroke={`url(#${gid})`} strokeWidth="2.6" opacity="0.95" />
        {/* bottom-right */}
        <circle cx="29.6" cy="27.5" r="9" stroke={`url(#${gid})`} strokeWidth="2.6" opacity="0.95" />
      </g>

      {/* Central identity core */}
      <circle cx="24" cy="24" r="3.4" fill={`url(#${cid})`} />
      <circle cx="24" cy="24" r="3.4" stroke="#fff7e0" strokeWidth="0.5" strokeOpacity="0.6" />
    </svg>
  )
}
