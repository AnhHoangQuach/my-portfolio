/**
 * Render quality tier. `low` keeps the look but trims the expensive parts:
 * a smaller shadow map, no cloud shadows and a lower pixel-ratio ceiling.
 */
export type Quality = 'high' | 'low'

export const QUALITY = {
  high: { maxDpr: 1.75, shadowMap: 2048, cloudShadows: true },
  low: { maxDpr: 1.25, shadowMap: 1024, cloudShadows: false },
} as const

/** `?quality=high|low` pins the tier (handy for comparing, or on a known-weak device). */
export function forcedQuality(): Quality | null {
  if (typeof window === 'undefined') return null
  const q = new URLSearchParams(window.location.search).get('quality')
  return q === 'high' || q === 'low' ? q : null
}

/** Best guess before the first frame; PerformanceMonitor corrects it at runtime. */
export function detectQuality(): Quality {
  if (typeof window === 'undefined') return 'high'
  const forced = forcedQuality()
  if (forced) return forced
  const nav = navigator as Navigator & { deviceMemory?: number }
  const smallTouch =
    window.matchMedia('(pointer: coarse)').matches &&
    Math.min(window.screen.width, window.screen.height) < 900
  const weakCpu = (nav.hardwareConcurrency ?? 8) <= 4
  const lowMemory = (nav.deviceMemory ?? 8) <= 4
  return smallTouch || weakCpu || lowMemory ? 'low' : 'high'
}
