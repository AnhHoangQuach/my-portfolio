'use client'

import dynamic from 'next/dynamic'
import { useEffect } from 'react'

/**
 * Suppress THREE.Clock deprecation warning from @react-three/fiber v9.
 * R3F internally uses `new THREE.Clock()` which three.js r184+ deprecated
 * in favor of THREE.Timer. This is fixed in R3F v10 (alpha).
 */
export function useSupressThreeWarnings() {
  useEffect(() => {
    const origWarn = console.warn
    console.warn = (...args: unknown[]) => {
      if (typeof args[0] === 'string' && args[0].includes('THREE.Clock')) return
      origWarn.apply(console, args)
    }
    return () => {
      console.warn = origWarn
    }
  }, [])
}

export const ParticleNetwork = dynamic(
  () => import('./particle-network').then((mod) => mod.ParticleNetwork),
  { ssr: false },
)

export const FloatingShapes = dynamic(
  () => import('./floating-shapes').then((mod) => mod.FloatingShapes),
  { ssr: false },
)
