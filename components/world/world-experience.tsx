'use client'

import { Component, useEffect, useSyncExternalStore, type ReactNode } from 'react'
import dynamic from 'next/dynamic'

import {
  LANDMARK_ORDER,
  landmarkForSection,
  type LandmarkId,
  type SectionId,
} from '@/lib/world/landmarks'
import { DAY_HOUR, NIGHT_HOUR, TIME_MODE_KEY, parseTimeParam } from '@/lib/world/clock'
import { useWorld } from '@/lib/world/store'
import { useReducedMotion } from '@/components/use-reduced-motion'
import { IntroOverlay, LoadingScreen } from './ui/overlays'
import type { WorldStrings } from './strings'
import './world.css'

// three.js and the whole scene are a separate chunk, fetched and run only
// once the visitor interacts (see `START_EVENTS`): the first view is the
// server-rendered welcome screen, so the page is fast and quiet until someone
// actually wants the 3D world — and crawlers never pay for it.
const WorldCanvas = dynamic(() => import('./world-canvas'), { ssr: false })
// The HUD, the section panels and the fire-show clock only matter once the
// world is up, so they load with it rather than with the welcome screen.
const Hud = dynamic(() => import('./ui/hud').then((m) => m.Hud), { ssr: false })
const InfoPanel = dynamic(() => import('./ui/info-panel').then((m) => m.InfoPanel), { ssr: false })
const FireShowTicker = dynamic(() => import('./ui/fire-show').then((m) => m.FireShowTicker), { ssr: false })

/** Any of these, once, starts the world (as does the welcome screen's button). */
const START_EVENTS = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'] as const

let webglSupport: boolean | undefined

/** Probed once per page load; `null` on the server, where we can't know. */
function hasWebGL() {
  if (webglSupport === undefined) {
    try {
      const c = document.createElement('canvas')
      webglSupport = !!(c.getContext('webgl2') || c.getContext('webgl'))
    } catch {
      webglSupport = false
    }
  }
  return webglSupport
}
const noSubscribe = () => () => {}

class CanvasBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

function Fallback({ strings }: { strings: WorldStrings }) {
  return (
    <div className="absolute inset-0 z-50 grid place-items-center p-6">
      <div className="world-card max-w-md p-6 text-center">
        <h2 className="font-heading text-2xl font-bold">{strings.fallback.title}</h2>
        <p className="mt-2 text-sm text-(--w-ink-soft)">{strings.fallback.body}</p>
        {/* The page already carries every section as text (#world-text);
            without WebGL we simply show it instead of the map. */}
        <button
          type="button"
          onClick={() => {
            document.documentElement.dataset.textMode = ''
            document.getElementById('world-text')?.focus()
          }}
          className="world-btn world-btn-primary mt-5 px-5 py-2.5"
        >
          {strings.fallback.cta}
        </button>
      </div>
    </div>
  )
}

export function WorldExperience({
  strings,
  panels,
  locale,
}: {
  strings: WorldStrings
  panels: Record<SectionId, ReactNode>
  locale: string
}) {
  const reduced = useReducedMotion()
  const webgl = useSyncExternalStore<boolean | null>(noSubscribe, hasWebGL, () => null)
  const night = useWorld((s) => s.nightUi)
  const started = useWorld((s) => s.started)

  useEffect(() => {
    if (started) return
    const start = () => useWorld.getState().start()
    for (const e of START_EVENTS) window.addEventListener(e, start, { once: true, passive: true })
    return () => {
      for (const e of START_EVENTS) window.removeEventListener(e, start)
    }
  }, [started])

  useEffect(() => {
    useWorld.getState().setReducedMotion(reduced)
  }, [reduced])

  // Time of day: `?time=day|night|HH:MM` wins, then the remembered choice,
  // else the live clock in Da Nang.
  useEffect(() => {
    const fromUrl = parseTimeParam(new URLSearchParams(window.location.search).get('time'))
    let saved: string | null = null
    try {
      saved = window.localStorage.getItem(TIME_MODE_KEY)
    } catch {
      saved = null
    }
    const hour = fromUrl ?? (saved === 'day' ? DAY_HOUR : saved === 'night' ? NIGHT_HOUR : null)
    useWorld.getState().setTimeOverride(hour)
  }, [])

  // `/?at=contact` (from the blog, case studies, 404…) opens that landmark
  // directly. Read on the client so the page itself stays statically rendered.
  useEffect(() => {
    const at = new URLSearchParams(window.location.search).get('at')
    useWorld.getState().setDeepLink(landmarkForSection(at))
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useWorld.getState()
      if (e.key === 'Escape') {
        if (s.ride === 'on') s.stopRide()
        else if (s.activeId) s.back()
        else if (s.phase === 'intro' || s.phase === 'welcome') s.skipIntro()
        return
      }
      // ← / → travel the journey in order. Left alone while typing or with modifiers.
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      // While riding, the arrow keys steer (see ui/ride-hud.tsx).
      if (s.phase !== 'explore' || s.ride === 'on' || e.altKey || e.ctrlKey || e.metaKey) return
      const el = e.target as HTMLElement | null
      if (el?.closest('input, textarea, select, [contenteditable="true"]')) return
      const step = e.key === 'ArrowRight' ? 1 : -1
      const i = s.activeId ? LANDMARK_ORDER.indexOf(s.activeId) : step > 0 ? -1 : 0
      const n = LANDMARK_ORDER.length
      e.preventDefault()
      s.focus(LANDMARK_ORDER[(i + step + n) % n])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Leaving the page (client navigation) must not leave a pointer cursor behind.
  useEffect(() => () => void (document.body.style.cursor = ''), [])

  const labels = Object.fromEntries(
    Object.entries(strings.landmarks).map(([id, l]) => [id, { name: l.name, section: l.section }]),
  ) as Record<LandmarkId, { name: string; section: string }>

  const fallback = <Fallback strings={strings} />

  return (
    <div className="world-root fixed inset-0 overflow-hidden" data-night={night || undefined}>
      {webgl === false ? (
        fallback
      ) : webgl && started ? (
        <CanvasBoundary fallback={fallback}>
          <WorldCanvas labels={labels} />
        </CanvasBoundary>
      ) : null}

      {webgl !== false && (
        <>
          {started && (
            <>
              <FireShowTicker />
              <Hud strings={strings} locale={locale} />
              <InfoPanel strings={strings} panels={panels} />
            </>
          )}
          <IntroOverlay strings={strings} />
          <LoadingScreen strings={strings} />
        </>
      )}
    </div>
  )
}
