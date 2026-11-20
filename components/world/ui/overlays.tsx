'use client'

import { useEffect, useState } from 'react'
import { Compass, FastForward } from 'lucide-react'

import { useWorld } from '@/lib/world/store'
import type { WorldStrings } from '../strings'

/* ------------------------------------------------------------------------ */
/* Loading screen                                                            */
/* ------------------------------------------------------------------------ */

/**
 * Server-rendered and visible on first paint, so the page has a real LCP
 * element before a single byte of three.js arrives.
 */
export function LoadingScreen({ strings }: { strings: WorldStrings }) {
  const phase = useWorld((s) => s.phase)
  const stage = useWorld((s) => s.loadStage)
  const [gone, setGone] = useState(false)
  const done = phase !== 'loading'

  useEffect(() => {
    if (!done) return
    const t = window.setTimeout(() => setGone(true), 1100)
    return () => window.clearTimeout(t)
  }, [done])

  if (gone) return null
  const stages = strings.loading.stages
  const pct = Math.round((Math.min(stage, 4) / 4) * 100)

  return (
    <div
      className="absolute inset-0 z-50 grid place-items-center overflow-hidden transition-opacity duration-1000 ease-out"
      style={{
        opacity: done ? 0 : 1,
        pointerEvents: done ? 'none' : 'auto',
        background: 'linear-gradient(180deg, #A9D8E8 0%, #D9EFF2 55%, #FFF0D6 100%)',
      }}
      aria-busy={!done}
    >
      <div className="world-cloud top-[14%] left-[8%] h-10 w-44" />
      <div className="world-cloud top-[26%] right-[6%] h-12 w-56 [animation-delay:-5s]" />
      <div className="world-cloud bottom-[18%] left-[18%] h-9 w-36 [animation-delay:-9s]" />

      <div className="relative flex w-full max-w-md flex-col items-center px-6 text-center">
        <p className="font-mono text-xs tracking-[0.3em] text-(--w-wood-dark) uppercase">
          {strings.kicker}
        </p>
        <p className="mt-3 font-heading text-4xl font-bold tracking-tight text-balance text-(--w-ink) sm:text-5xl">
          {strings.identity.name}
        </p>
        <p className="mt-2 text-sm font-medium text-(--w-ink-soft)">
          {strings.identity.role} · {strings.identity.location}
        </p>
        <div
          className="mt-8 h-3 w-full overflow-hidden rounded-full border-2 border-(--w-wood)/40 bg-(--w-paper)/70"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-label={strings.loading.title}
        >
          <div
            className="h-full rounded-full transition-[width] duration-700 ease-out"
            style={{
              width: `${Math.max(6, pct)}%`,
              background: 'linear-gradient(90deg, #69C5C0, #F2B632)',
            }}
          />
        </div>
        <p className="mt-3 min-h-5 text-sm text-(--w-ink-soft)" aria-live="polite">
          {stages[Math.min(stage, stages.length - 1)]}
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------------ */
/* Intro flight + title card                                                 */
/* ------------------------------------------------------------------------ */

export function IntroOverlay({ strings }: { strings: WorldStrings }) {
  const phase = useWorld((s) => s.phase)
  const skipIntro = useWorld((s) => s.skipIntro)
  const focus = useWorld((s) => s.focus)
  const words = strings.intro.title.split(' ')
  // Staggered entrance, timed like a single timeline: kicker, then each word,
  // then the subtitle, then the buttons. Pure CSS (see `.world-rise`).
  const delay = (seconds: number) => ({ animationDelay: `${seconds}s` })
  const wordsEnd = 0.3 + words.length * 0.08

  return (
    <>
      {/* White-out that the flight emerges from, like falling through clouds. */}
      <div
        className="pointer-events-none absolute inset-0 z-30 bg-white transition-opacity duration-[2600ms] ease-out"
        style={{ opacity: phase === 'loading' ? 1 : 0 }}
        aria-hidden
      />

      {phase === 'intro' && (
        <div className="absolute inset-x-0 bottom-8 z-40 flex justify-center">
          <button type="button" onClick={skipIntro} className="world-btn world-btn-ghost px-4 py-2 text-sm">
            <FastForward className="size-4" aria-hidden />
            {strings.intro.skip}
          </button>
        </div>
      )}

      {phase === 'welcome' && (
        <div
          className="pointer-events-none absolute inset-0 z-40 flex items-end justify-center pb-[12vh] sm:items-center sm:pb-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 45% at 50% 50%, rgb(62 58 52 / 0.32), transparent 70%)',
          }}
        >
          <div
            className="pointer-events-auto flex max-w-xl flex-col items-center px-6 text-center [perspective:600px]"
            role="dialog"
            aria-labelledby="world-welcome-title"
          >
            <p
              style={delay(0)}
              className="world-rise rounded-full bg-(--w-paper)/80 px-3 py-1 font-mono text-[11px] tracking-[0.28em] text-(--w-wood-dark) uppercase shadow-sm"
            >
              {strings.kicker}
            </p>
            <h2
              id="world-welcome-title"
              className="mt-4 font-heading text-4xl leading-tight font-bold text-white sm:text-6xl"
              style={{ textShadow: '0 2px 0 rgb(126 87 62 / 0.35), 0 8px 30px rgb(62 58 52 / 0.35)' }}
            >
              {words.map((w, i) => (
                <span
                  key={i}
                  style={delay(0.3 + i * 0.08)}
                  className="world-rise world-rise-tilt inline-block whitespace-pre"
                >
                  {w}{' '}
                </span>
              ))}
            </h2>
            <p
              className="world-rise mt-3 text-base font-medium text-white sm:text-lg"
              style={{ ...delay(wordsEnd), textShadow: '0 1px 12px rgb(62 58 52 / 0.45)' }}
            >
              {strings.intro.subtitle}
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                autoFocus
                onClick={() => focus('dragon-bridge')}
                style={delay(wordsEnd + 0.25)}
                className="world-rise world-btn world-btn-primary px-5 py-3 text-base"
              >
                <Compass className="size-5" aria-hidden />
                {strings.intro.explore}
              </button>
              <button
                type="button"
                onClick={skipIntro}
                style={delay(wordsEnd + 0.35)}
                className="world-rise world-btn world-btn-ghost px-4 py-2.5 text-sm"
              >
                {strings.intro.skip}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
