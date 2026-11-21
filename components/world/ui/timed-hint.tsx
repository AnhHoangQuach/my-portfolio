'use client'

import { useEffect, useState, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

/** A one-time controls hint under the top bar that fades out after `ms`. */
export function TimedHint({
  children,
  ms = 7000,
  className,
}: {
  children: ReactNode
  ms?: number
  className?: string
}) {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const t = window.setTimeout(() => setVisible(false), ms)
    return () => window.clearTimeout(t)
  }, [ms])
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-x-0 top-20 z-30 flex justify-center px-4 transition-opacity duration-700',
        visible ? 'opacity-100' : 'opacity-0',
        className,
      )}
      aria-hidden={!visible}
    >
      <p className="world-card flex items-center gap-2 rounded-full! px-4 py-2 text-xs font-medium text-(--w-ink-soft)">
        {children}
      </p>
    </div>
  )
}
