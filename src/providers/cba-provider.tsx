'use client'

import { useEffect, useRef, useState, useCallback, createContext, useContext } from 'react'

// ── Continuous Behavioral Authentication (CBA) ──
// Passively verifies identity via real-time mouse/click/scroll patterns.
// Builds a statistical baseline, then detects deviations (session hijack).
// If deviation > threshold for N consecutive windows → passive step-up.
// All behavioral data stays CLIENT-SIDE. Only the deviation score is used.

interface FeatureVector {
  mouseVelocity: number   // mean pixels/ms
  mouseVariance: number   // variance of velocity
  clickRate: number       // clicks per second
  scrollVelocity: number  // mean |deltaY| per scroll
  directionChanges: number // mouse direction reversals
  idleRatio: number       // fraction of window with no movement
}

interface Baseline {
  mean: FeatureVector
  std: FeatureVector
  count: number
  ready: boolean
}

interface CBAState {
  deviation: number      // current deviation score (0 = perfect match)
  status: 'baseline' | 'matching' | 'deviating' | 'step-up'
  baselineProgress: number // 0-1
  windowCount: number
  features: FeatureVector | null
  history: number[]      // last 20 deviation scores
}

const CBAContext = createContext<CBAState>({
  deviation: 0,
  status: 'baseline',
  baselineProgress: 0,
  windowCount: 0,
  features: null,
  history: [],
})

export const useCBA = () => useContext(CBAContext)

const WINDOW_MS = 5000       // 5-second feature windows
const BASELINE_WINDOWS = 10   // 50 seconds to build baseline
const DEVIATION_THRESHOLD = 3.0  // z-score sum threshold
const CONSECUTIVE_HITS = 3   // consecutive windows above threshold → step-up

function emptyFeatures(): FeatureVector {
  return { mouseVelocity: 0, mouseVariance: 0, clickRate: 0, scrollVelocity: 0, directionChanges: 0, idleRatio: 1 }
}

function computeDeviation(current: FeatureVector, baseline: Baseline): number {
  if (!baseline.ready) return 0
  const fields: (keyof FeatureVector)[] = ['mouseVelocity', 'mouseVariance', 'clickRate', 'scrollVelocity', 'directionChanges', 'idleRatio']
  let sum = 0
  for (const f of fields) {
    const std = baseline.std[f] || 0.001
    const z = Math.abs((current[f] - baseline.mean[f]) / std)
    sum += z
  }
  return sum
}

export function CBAProvider({ children, onStepUp }: { children: React.ReactNode; onStepUp?: () => void }) {
  const [state, setState] = useState<CBAState>({
    deviation: 0,
    status: 'baseline',
    baselineProgress: 0,
    windowCount: 0,
    features: null,
    history: [],
  })

  const baselineRef = useRef<Baseline>({ mean: emptyFeatures(), std: emptyFeatures(), count: 0, ready: false })
  const eventsRef = useRef<{ x: number; y: number; t: number; type: string; deltaY?: number }[]>([])
  const lastMouseRef = useRef<{ x: number; y: number; t: number } | null>(null)
  const lastDirRef = useRef<number>(0)
  const consecutiveHitsRef = useRef(0)
  const stepUpTriggeredRef = useRef(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Throttled event collection
  const lastCollectRef = useRef(0)
  const collectEvent = useCallback((type: string, x?: number, y?: number, deltaY?: number) => {
    const now = Date.now()
    if (now - lastCollectRef.current < 50 && type === 'mousemove') return // throttle mousemove to 20fps
    lastCollectRef.current = now

    eventsRef.current.push({ x: x ?? 0, y: y ?? 0, t: now, type, deltaY })

    if (type === 'mousemove' && lastMouseRef.current) {
      const dx = (x ?? 0) - lastMouseRef.current.x
      const dy = (y ?? 0) - lastMouseRef.current.y
      const angle = Math.atan2(dy, dx)
      if (lastDirRef.current !== 0) {
        const diff = Math.abs(angle - lastDirRef.current)
        if (diff > Math.PI / 2) {
          eventsRef.current.push({ x: 0, y: 0, t: now, type: 'directionChange' })
        }
      }
      lastDirRef.current = angle
    }
    lastMouseRef.current = { x: x ?? 0, y: y ?? 0, t: now }
  }, [])

  // Compute feature vector from accumulated events
  const computeFeatures = useCallback((): FeatureVector => {
    const events = eventsRef.current
    const windowStart = Date.now() - WINDOW_MS
    const recent = events.filter((e) => e.t > windowStart)
    eventsRef.current = recent // keep only recent

    const mouseMoves = recent.filter((e) => e.type === 'mousemove')
    const clicks = recent.filter((e) => e.type === 'click')
    const scrolls = recent.filter((e) => e.type === 'scroll')
    const dirChanges = recent.filter((e) => e.type === 'directionChange').length

    // Mouse velocity (pixels per ms)
    let velocities: number[] = []
    for (let i = 1; i < mouseMoves.length; i++) {
      const dx = mouseMoves[i].x - mouseMoves[i - 1].x
      const dy = mouseMoves[i].y - mouseMoves[i - 1].y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const dt = mouseMoves[i].t - mouseMoves[i - 1].t
      if (dt > 0) velocities.push(dist / dt)
    }
    const meanV = velocities.length ? velocities.reduce((a, b) => a + b, 0) / velocities.length : 0
    const varV = velocities.length > 1
      ? velocities.reduce((a, b) => a + (b - meanV) ** 2, 0) / velocities.length
      : 0

    const clickRate = clicks.length / (WINDOW_MS / 1000)
    const scrollVel = scrolls.length
      ? scrolls.reduce((a, b) => a + Math.abs(b.deltaY ?? 0), 0) / scrolls.length
      : 0
    const idleMs = mouseMoves.length === 0 ? WINDOW_MS : 0
    const idleRatio = idleMs / WINDOW_MS

    return {
      mouseVelocity: meanV,
      mouseVariance: varV,
      clickRate,
      scrollVelocity: scrollVel,
      directionChanges: dirChanges,
      idleRatio,
    }
  }, [])

  // Update baseline with a new feature vector
  const updateBaseline = useCallback((fv: FeatureVector) => {
    const b = baselineRef.current
    b.count++
    const fields: (keyof FeatureVector)[] = ['mouseVelocity', 'mouseVariance', 'clickRate', 'scrollVelocity', 'directionChanges', 'idleRatio']
    if (b.count === 1) {
      b.mean = { ...fv }
      b.std = emptyFeatures()
    } else {
      // Online mean + variance (Welford's algorithm)
      for (const f of fields) {
        const delta = fv[f] - b.mean[f]
        b.mean[f] += delta / b.count
        const delta2 = fv[f] - b.mean[f]
        b.std[f] = b.count > 1 ? b.std[f] * (b.count - 2) / (b.count - 1) + delta * delta2 / (b.count - 1) : 0
      }
    }
    if (b.count >= BASELINE_WINDOWS) b.ready = true
    return { ...b, mean: { ...b.mean }, std: { ...b.std } }
  }, [])

  // Main loop — compute features every WINDOW_MS
  useEffect(() => {
    // Attach event listeners (passive, non-blocking)
    const onMouseMove = (e: MouseEvent) => collectEvent('mousemove', e.clientX, e.clientY)
    const onClick = (e: MouseEvent) => collectEvent('click', e.clientX, e.clientY)
    const onScroll = (e: Event) => {
      const target = e.target as Element
      const deltaY = target?.scrollTop ?? window.scrollY
      collectEvent('scroll', 0, 0, deltaY)
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true })
    window.addEventListener('click', onClick, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })

    // Compute features every WINDOW_MS
    intervalRef.current = setInterval(() => {
      const fv = computeFeatures()
      const b = baselineRef.current

      if (!b.ready) {
        // Still building the baseline
        updateBaseline(fv)
        setState((prev) => ({
          ...prev,
          deviation: 0,
          status: 'baseline',
          baselineProgress: b.count / BASELINE_WINDOWS,
          windowCount: prev.windowCount + 1,
          features: fv,
          history: [...prev.history, 0].slice(-20),
        }))
      } else {
        // Compute deviation
        const dev = computeDeviation(fv, { ...b, ready: true })
        const isDeviating = dev > DEVIATION_THRESHOLD

        if (isDeviating) {
          consecutiveHitsRef.current++
        } else {
          consecutiveHitsRef.current = 0
          stepUpTriggeredRef.current = false // reset on normal behavior
        }

        // Trigger step-up if N consecutive deviating windows
        if (consecutiveHitsRef.current >= CONSECUTIVE_HITS && !stepUpTriggeredRef.current) {
          stepUpTriggeredRef.current = true
          onStepUp?.()
        }

        setState((prev) => ({
          ...prev,
          deviation: dev,
          status: stepUpTriggeredRef.current ? 'step-up' : isDeviating ? 'deviating' : 'matching',
          baselineProgress: 1,
          windowCount: prev.windowCount + 1,
          features: fv,
          history: [...prev.history, dev].slice(-20),
        }))
      }
    }, WINDOW_MS)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('click', onClick)
      window.removeEventListener('scroll', onScroll)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [collectEvent, computeFeatures, updateBaseline, onStepUp])

  return <CBAContext.Provider value={state}>{children}</CBAContext.Provider>
}
