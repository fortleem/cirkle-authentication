'use client'

import { useMemo } from 'react'

interface IdentityDNAProps {
  seed: string
  size?: number
  className?: string
}

/**
 * Identity DNA — a deterministic generative avatar unique per Cirkle identity.
 * Concentric rings of nodes whose count, angle, size, and color are derived
 * from a SHA-ish hash of the user's username. No two users share the same
 * pattern. Brand-aligned (gold/rose/teal palette) + animated slow rotation.
 */
export function IdentityDNA({ seed, size = 80, className }: IdentityDNAProps) {
  const rings = useMemo(() => computeRings(seed), [seed])

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={`Identity DNA for ${seed}`}
    >
      <defs>
        <radialGradient id={`dna-core-${size}-${seed.slice(0, 4)}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="hsl(var(--gold))" />
          <stop offset="1" stopColor="hsl(var(--teal))" />
        </radialGradient>
        <linearGradient id={`dna-grad-${size}-${seed.slice(0, 4)}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="hsl(var(--gold))" />
          <stop offset="0.5" stopColor="hsl(var(--rose))" />
          <stop offset="1" stopColor="hsl(var(--teal))" />
        </linearGradient>
      </defs>

      <g className="cirkle-spin-trefoil" style={{ transformOrigin: '50px 50px' }}>
        {/* Outer ring trace */}
        <circle cx="50" cy="50" r="46" stroke="hsl(var(--gold) / 0.12)" strokeWidth="0.5" />
        {rings.map((ring, ri) => {
          const r = 14 + ri * 11
          return ring.nodes.map((node, ni) => {
            const x = 50 + Math.cos(node.angle) * r
            const y = 50 + Math.sin(node.angle) * r
            const color = ['hsl(var(--gold))', 'hsl(var(--rose))', 'hsl(var(--teal))'][node.colorIdx % 3]
            return (
              <circle
                key={`${ri}-${ni}`}
                cx={x}
                cy={y}
                r={node.size}
                fill={color}
                opacity={node.opacity}
              />
            )
          })
        })}
        {/* Connecting arcs between same-ring nodes (the constellation lines) */}
        {rings.map((ring, ri) => {
          const r = 14 + ri * 11
          if (ring.nodes.length < 2) return null
          const pts = ring.nodes.map((n) => {
            const x = 50 + Math.cos(n.angle) * r
            const y = 50 + Math.sin(n.angle) * r
            return `${x},${y}`
          }).join(' ')
          return (
            <polygon
              key={`poly-${ri}`}
              points={pts}
              fill="none"
              stroke="hsl(var(--gold) / 0.15)"
              strokeWidth="0.4"
            />
          )
        })}
      </g>

      {/* Core */}
      <circle cx="50" cy="50" r="6" fill={`url(#dna-core-${size}-${seed.slice(0, 4)})`} />
      <circle cx="50" cy="50" r="6" stroke="hsl(var(--cream))" strokeWidth="0.5" strokeOpacity="0.6" />
    </svg>
  )
}

interface Ring { nodes: { angle: number; size: number; colorIdx: number; opacity: number }[] }

/** A small, fast, deterministic string hash (FNV-1a-ish) → 32-bit. */
function hashStr(s: string): number[] {
  let h1 = 0x811c9dc5
  let h2 = 0x1000193
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0
    h2 = Math.imul(h2 + c, 0x05031813) >>> 0
  }
  // derive a stream of pseudo-random numbers
  const stream: number[] = []
  let a = h1, b = h2
  for (let i = 0; i < 32; i++) {
    a = (Math.imul(a, 0x9e3779b1) ^ b) >>> 0
    b = (Math.imul(b, 0x85ebca77) ^ a) >>> 0
    stream.push(((a ^ b) >>> 0) / 0xffffffff)
  }
  return stream
}

function computeRings(seed: string): Ring[] {
  const stream = hashStr(seed.toLowerCase())
  const ringCount = 3 + Math.floor(stream[0] * 2) // 3–4 rings
  const rings: Ring[] = []
  let si = 1
  for (let ri = 0; ri < ringCount; ri++) {
    const nodeCount = 4 + Math.floor(stream[si++ % stream.length] * 9) // 4–12 nodes
    const baseAngle = stream[si++ % stream.length] * Math.PI * 2
    const twist = (stream[si++ % stream.length] - 0.5) * 0.6 // ring rotation offset
    const nodes = []
    for (let ni = 0; ni < nodeCount; ni++) {
      const angle = baseAngle + twist + (ni / nodeCount) * Math.PI * 2
      const size = 0.8 + stream[si++ % stream.length] * 2.2
      const colorIdx = Math.floor(stream[si++ % stream.length] * 3)
      const opacity = 0.45 + stream[si++ % stream.length] * 0.55
      nodes.push({ angle, size, colorIdx, opacity })
    }
    rings.push({ nodes })
  }
  return rings
}

/** Initials fallback (for when DNA can't render) — 1-2 chars from the name. */
export function dnaInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'C'
}
