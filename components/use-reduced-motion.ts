'use client'

import { useEffect, useState } from 'react'

/**
 * Tracks `prefers-reduced-motion`. Starts `false` so server and client markup
 * agree; the effect corrects it before any animation has a chance to run.
 */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(query.matches)
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  return reduced
}
