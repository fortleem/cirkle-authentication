'use client'

import { useEffect, useState } from 'react'

interface PostureGaugeProps {
  score: number
  total: number
  label?: string
  size?: number
}

export function PostureGauge({ score, total, label = 'Security posture', size = 200 }: PostureGaugeProps) {
  const [animated, setAnimated] = useState(0)
  const pct = total > 0 ? Math.round((score / total) * 100) : 0
  const radius = 80
  const circumference = 2 * Math.PI * radius
  const stroke = 10

  useEffect(() => {
    // Animate the ring fill on mount
    const t = setTimeout(() => setAnimated(pct), 120)
    return () => clearTimeout(t)
  }, [pct])

  const offset = circumference - (animated / 100) * circumference
  const grade = pct >= 90 ? 'Maximum' : pct >= 70 ? 'Strong' : pct >= 50 ? 'Fair' : 'Developing'
  const gradeColor = pct >= 70 ? 'var(--primary)' : pct >= 50 ? 'var(--gold)' : 'var(--rose)'

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 200 200" className="-rotate-90">
        <defs>
          <linearGradient id="posture-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--gold))" />
            <stop offset="50%" stopColor="hsl(var(--rose))" />
            <stop offset="100%" stopColor="hsl(var(--teal))" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle cx="100" cy="100" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
        {/* Fill */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="url(#posture-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-display text-4xl font-semibold tabular-nums" style={{ color: gradeColor }}>{animated}</div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">/ 100</div>
        <div className="mt-1 text-xs font-medium" style={{ color: gradeColor }}>{grade}</div>
        <div className="mt-0.5 text-[10px] text-muted-foreground">{label}</div>
      </div>
    </div>
  )
}
