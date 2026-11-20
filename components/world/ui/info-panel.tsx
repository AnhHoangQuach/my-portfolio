'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'

import { LANDMARKS, LANDMARK_ORDER, type LandmarkId, type SectionId } from '@/lib/world/landmarks'
import { useWorld } from '@/lib/world/store'
import { cn } from '@/lib/utils'
import { SectionIcon } from '../section-icon'
import type { WorldStrings } from '../strings'

/**
 * The quest log: a paper card on the right on desktop, a bottom sheet on
 * phones. Its body is server-rendered per section and passed in as `panels`.
 */
export function InfoPanel({
  strings,
  panels,
}: {
  strings: WorldStrings
  panels: Record<SectionId, React.ReactNode>
}) {
  const activeId = useWorld((s) => s.activeId)
  const back = useWorld((s) => s.back)
  const focus = useWorld((s) => s.focus)
  const heading = useRef<HTMLHeadingElement>(null)
  const scroller = useRef<HTMLDivElement>(null)

  // Keep the last landmark mounted while the panel animates out. Opening is
  // adopted during render; closing waits for the exit transition.
  const [shown, setShown] = useState<LandmarkId | null>(activeId)
  if (activeId && activeId !== shown) setShown(activeId)
  useEffect(() => {
    if (activeId) return
    const t = window.setTimeout(() => setShown(null), 350)
    return () => window.clearTimeout(t)
  }, [activeId])

  useEffect(() => {
    if (!activeId) return
    scroller.current?.scrollTo({ top: 0 })
    heading.current?.focus({ preventScroll: true })
  }, [activeId])

  if (!shown) return null
  const open = activeId !== null
  const cfg = LANDMARKS[shown]
  const s = strings.landmarks[shown]
  const index = LANDMARK_ORDER.indexOf(shown)
  const prev = LANDMARK_ORDER[(index - 1 + LANDMARK_ORDER.length) % LANDMARK_ORDER.length]
  const next = LANDMARK_ORDER[(index + 1) % LANDMARK_ORDER.length]

  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-labelledby="world-panel-title"
      className={cn(
        'world-card absolute z-40 flex flex-col overflow-hidden transition-[opacity,transform] duration-350 ease-out',
        // Phone: bottom sheet. Desktop: right-hand card.
        'inset-x-2 bottom-2 max-h-[62dvh]',
        'lg:inset-x-auto lg:top-20 lg:right-4 lg:bottom-4 lg:max-h-none lg:w-105',
        open ? 'translate-y-0 opacity-100 lg:translate-x-0' : 'pointer-events-none translate-y-6 opacity-0 lg:translate-x-6 lg:translate-y-0',
      )}
      style={{ '--accent': cfg.accent } as React.CSSProperties}
    >
      <div className="h-1.5 w-full shrink-0" style={{ background: cfg.accent }} aria-hidden />
      <header className="flex shrink-0 items-start gap-3 px-5 pt-4 pb-3">
        <span
          className="grid size-11 shrink-0 place-items-center rounded-full bg-(--w-paper)"
          style={{ color: cfg.accent, border: `2px solid ${cfg.accent}` }}
          aria-hidden
        >
          <SectionIcon section={cfg.section} className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] tracking-[0.22em] text-(--w-ink-soft) uppercase">
            {strings.panel.stop} {index + 1}/{LANDMARK_ORDER.length} · {s.name}
          </p>
          <h2
            id="world-panel-title"
            ref={heading}
            tabIndex={-1}
            className="mt-0.5 font-heading text-2xl font-bold outline-none"
          >
            {s.section}
          </h2>
          <p className="mt-1 text-sm text-(--w-ink-soft)">{s.blurb}</p>
        </div>
      </header>

      <div ref={scroller} className="world-scroll min-h-0 flex-1 overflow-y-auto px-5 pb-4">
        {panels[cfg.section]}
      </div>

      <footer className="flex shrink-0 items-center gap-2 border-t border-(--w-wood)/20 bg-(--w-paper-2)/60 px-3 py-2.5">
        <button type="button" onClick={back} className="world-btn world-btn-primary px-4 py-2 text-sm">
          <ArrowLeft className="size-4" aria-hidden />
          {strings.panel.back}
        </button>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => focus(prev)}
            className="world-btn world-btn-ghost size-9 justify-center"
            aria-label={`${strings.panel.previous}: ${strings.landmarks[prev].section}`}
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => focus(next)}
            className="world-btn world-btn-ghost py-2 pr-2.5 pl-3.5 text-sm"
          >
            {strings.panel.next}: {strings.landmarks[next].section}
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      </footer>
    </section>
  )
}
