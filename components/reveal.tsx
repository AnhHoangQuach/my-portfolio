'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

/**
 * Scroll reveals are CSS transitions toggled by a single shared
 * IntersectionObserver — not a JS animation library.
 *
 * Two reasons: one observer for the whole page instead of per-element
 * machinery, and the transition itself runs off the main thread. Never wrap
 * above-the-fold content in this — the element ships at `opacity: 0` and only
 * lifts after hydration, which would make it a terrible LCP candidate.
 */
let observer: IntersectionObserver | null = null

function getObserver() {
  if (typeof IntersectionObserver === 'undefined') return null
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.setAttribute('data-reveal', 'in')
        observer?.unobserve(entry.target)
      }
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
  )
  return observer
}

export function Reveal({ children, className, ...rest }: React.ComponentPropsWithoutRef<'div'>) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const io = getObserver()
    // No IntersectionObserver: show the content rather than hiding it forever.
    if (!io) {
      el.setAttribute('data-reveal', 'in')
      return
    }

    io.observe(el)
    return () => io.unobserve(el)
  }, [])

  return (
    <div ref={ref} data-reveal="1" className={className} {...rest}>
      {children}
    </div>
  )
}

/**
 * Container that cascades its `Reveal` children by a fixed step. The delay
 * comes from nth-child rules in globals.css, so it costs no JS.
 */
export function RevealGroup({
  children,
  className,
  ...rest
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div data-stagger="1" className={cn(className)} {...rest}>
      {children}
    </div>
  )
}
