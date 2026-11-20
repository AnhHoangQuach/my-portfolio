'use client'

import { Flame } from 'lucide-react'

import { useWorld } from '@/lib/world/store'

/** Makes the Dragon Bridge breathe fire. Strings arrive as props. */
export function FireButton({ label }: { label: string }) {
  const breatheFire = useWorld((s) => s.breatheFire)
  return (
    <button
      type="button"
      // Only meaningful next to the 3D scene; hidden in the text version.
      data-world-only=""
      onClick={breatheFire}
      className="world-btn world-btn-primary px-4 py-2 text-sm"
    >
      <Flame className="size-4" aria-hidden />
      {label}
    </button>
  )
}
