'use client'

import { Suspense, lazy, useEffect, useState } from 'react'
import { Car, Clock, Globe, LocateFixed, Menu, Moon, MousePointerClick, Sun, X } from 'lucide-react'

import Link from 'next/link'

import { getPathname } from '@/i18n/navigation'
import { DAY_HOUR, NIGHT_HOUR, TIME_MODE_KEY, daNangHour, formatHour } from '@/lib/world/clock'
import { LANDMARKS, LANDMARK_ORDER } from '@/lib/world/landmarks'
import { useWorld } from '@/lib/world/store'
import { cn } from '@/lib/utils'
import { SectionIcon } from '../section-icon'
import type { WorldStrings } from '../strings'
import { FireShowBadge } from './fire-show'
import { TimedHint } from './timed-hint'

// The map and the ride controls read the scene's geography (and three.js
// with it), so they load as their own chunks once the world is up — never
// on the critical path.
const Minimap = lazy(() => import('./minimap'))
const RideHud = lazy(() => import('./ride-hud'))

/**
 * Game-style heads-up display: identity badge, section menu, landmark dock,
 * overview button and a one-time controls hint. Only shown while exploring.
 */
export function Hud({ strings, locale }: { strings: WorldStrings; locale: string }) {
  const phase = useWorld((s) => s.phase)
  const activeId = useWorld((s) => s.activeId)
  const ride = useWorld((s) => s.ride)
  if (phase !== 'explore') return null

  return (
    <>
      <IdentityBadge strings={strings} />
      <TopMenu strings={strings} locale={locale} />
      <Suspense fallback={null}>
        <Minimap strings={strings} />
        {ride === 'on' && <RideHud strings={strings} />}
      </Suspense>
      {ride === 'off' && (
        <>
          <Dock strings={strings} hidden={activeId !== null} />
          <TimedHint>
            <MousePointerClick className="size-4 text-(--w-wood)" aria-hidden />
            {strings.hud.hint}
          </TimedHint>
        </>
      )}
      {activeId === null && <FireShowBadge strings={strings} />}
    </>
  )
}

function IdentityBadge({ strings }: { strings: WorldStrings }) {
  const resetView = useWorld((s) => s.resetView)
  const { identity } = strings
  return (
    <button
      type="button"
      onClick={resetView}
      className="world-card world-btn absolute top-3 left-3 z-40 gap-3 rounded-2xl! py-2 pr-4 pl-2 text-left sm:top-4 sm:left-4"
      aria-label={`${identity.name} — ${strings.hud.overview}`}
    >
      <span
        className="grid size-10 shrink-0 place-items-center rounded-full font-heading text-sm font-bold text-white"
        style={{ background: 'linear-gradient(135deg, #69C5C0, #F2B632)' }}
        aria-hidden
      >
        {identity.initials}
      </span>
      <span className="flex flex-col leading-tight">
        <span className="font-heading text-sm font-bold">{identity.name}</span>
        <span className="hidden text-xs text-(--w-ink-soft) sm:block">
          {identity.role} · {identity.location}
        </span>
        <span className="text-xs text-(--w-ink-soft) sm:hidden">{identity.role}</span>
      </span>
    </button>
  )
}

/**
 * Time of day: Auto follows the real clock in Da Nang (shown live), then the
 * fixed Day and Night overrides. Click cycles Auto → Day → Night → Auto.
 */
function TimeToggle({ strings }: { strings: WorldStrings }) {
  const override = useWorld((s) => s.timeOverride)
  const setOverride = useWorld((s) => s.setTimeOverride)
  const [now, setNow] = useState(() => formatHour(daNangHour()))

  useEffect(() => {
    const id = window.setInterval(() => setNow(formatHour(daNangHour())), 20000)
    return () => window.clearInterval(id)
  }, [])

  const mode = override === null ? 'auto' : override === DAY_HOUR ? 'day' : override === NIGHT_HOUR ? 'night' : 'custom'
  // A pinned custom hour (e.g. `?time=18:05`) shows that hour, not the clock.
  const label =
    mode === 'day'
      ? strings.hud.day
      : mode === 'night'
        ? strings.hud.night
        : `${strings.hud.daNang} ${override === null ? now : formatHour(override)}`
  const Icon = mode === 'day' ? Sun : mode === 'night' ? Moon : Clock

  const cycle = () => {
    const next = mode === 'auto' ? 'day' : mode === 'day' ? 'night' : 'auto'
    setOverride(next === 'day' ? DAY_HOUR : next === 'night' ? NIGHT_HOUR : null)
    try {
      window.localStorage.setItem(TIME_MODE_KEY, next)
    } catch {
      // Private mode or blocked storage: the choice just won't persist.
    }
  }

  return (
    <button
      type="button"
      onClick={cycle}
      className="world-btn world-btn-ghost px-3 py-1.5 text-xs tabular-nums"
      aria-label={`${strings.hud.timeOfDay}: ${label}`}
      title={strings.hud.timeOfDay}
    >
      <Icon className="size-3.5" aria-hidden />
      {label}
    </button>
  )
}

/**
 * The world is the only page, so switching language is a plain link to the
 * other locale's home — no client i18n runtime (or provider) needed.
 */
function LocaleToggle({ strings, locale }: { strings: WorldStrings; locale: string }) {
  const next = locale === 'en' ? 'ja' : 'en'
  return (
    <Link
      href={getPathname({ href: '/', locale: next })}
      replace
      hrefLang={next}
      className="world-btn world-btn-ghost px-3 py-1.5 text-xs"
      aria-label={`${strings.hud.localeLabel} — ${strings.hud.switchLocale}`}
    >
      <Globe className="size-3.5" aria-hidden />
      {strings.hud.localeLabel}
    </Link>
  )
}

function TopMenu({ strings, locale }: { strings: WorldStrings; locale: string }) {
  const [open, setOpen] = useState(false)
  const activeId = useWorld((s) => s.activeId)
  const focus = useWorld((s) => s.focus)

  const items = LANDMARK_ORDER.map((id) => ({ id, ...strings.landmarks[id] }))

  return (
    <nav aria-label={strings.hud.journey} className="absolute top-3 right-3 z-40 sm:top-4 sm:right-4">
      {/* Desktop: a row of section pills */}
      <div className="world-card hidden items-center gap-1 rounded-full! p-1.5 lg:flex">
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            onClick={() => focus(it.id)}
            aria-current={activeId === it.id ? 'location' : undefined}
            className={cn(
              'world-btn px-3 py-1.5 text-sm',
              activeId === it.id ? 'bg-(--w-ink) text-(--w-paper)' : 'hover:bg-(--w-paper-2)',
            )}
          >
            {it.section}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-(--w-wood)/30" aria-hidden />
        <TimeToggle strings={strings} />
        <LocaleToggle strings={strings} locale={locale} />
      </div>

      {/* Mobile / tablet: a menu button with a dropdown sheet */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="world-menu"
          className="world-card world-btn size-11 justify-center rounded-full!"
          aria-label={open ? strings.hud.closeMenu : strings.hud.menu}
        >
          {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
        </button>
        {open && (
          <div id="world-menu" className="world-card absolute top-13 right-0 w-64 p-2">
            <ul className="flex flex-col">
              {items.map((it) => (
                <li key={it.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false)
                      focus(it.id)
                    }}
                    aria-current={activeId === it.id ? 'location' : undefined}
                    className="world-btn w-full gap-3 rounded-xl! px-3 py-2.5 text-left hover:bg-(--w-paper-2)"
                  >
                    <span
                      className="grid size-8 place-items-center rounded-full bg-(--w-paper)"
                      style={{ color: LANDMARKS[it.id].accent, border: `2px solid ${LANDMARKS[it.id].accent}` }}
                    >
                      <SectionIcon section={LANDMARKS[it.id].section} className="size-4" />
                    </span>
                    <span className="flex flex-col leading-tight">
                      <span className="text-sm font-semibold">{it.section}</span>
                      <span className="text-xs font-normal text-(--w-ink-soft)">{it.name}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex items-center justify-between border-t border-(--w-wood)/20 px-2 pt-2">
              <span className="flex items-center gap-2">
                <TimeToggle strings={strings} />
                <LocaleToggle strings={strings} locale={locale} />
              </span>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

function Dock({ strings, hidden }: { strings: WorldStrings; hidden: boolean }) {
  const focus = useWorld((s) => s.focus)
  const hoveredId = useWorld((s) => s.hoveredId)
  const setHovered = useWorld((s) => s.setHovered)
  const resetView = useWorld((s) => s.resetView)
  const startRide = useWorld((s) => s.startRide)

  return (
    <div
      className={cn(
        'absolute inset-x-0 bottom-3 z-40 flex items-end justify-center gap-2 px-3 transition-[opacity,transform] duration-300 sm:bottom-5',
        hidden && 'pointer-events-none translate-y-4 opacity-0',
      )}
      aria-hidden={hidden || undefined}
    >
      <div className="world-card world-scroll-x flex max-w-full gap-1 overflow-x-auto rounded-2xl! p-1.5">
        {LANDMARK_ORDER.map((id) => {
          const cfg = LANDMARKS[id]
          const s = strings.landmarks[id]
          return (
            <button
              key={id}
              type="button"
              tabIndex={hidden ? -1 : 0}
              onClick={() => focus(id)}
              onPointerEnter={() => setHovered(id)}
              onPointerLeave={() => setHovered(null)}
              onFocus={() => setHovered(id)}
              onBlur={() => setHovered(null)}
              className={cn(
                'world-btn shrink-0 flex-col gap-1 rounded-xl! px-3 py-2 text-center',
                hoveredId === id ? 'bg-(--w-paper)' : 'hover:bg-(--w-paper)',
              )}
            >
              <span
                className="grid size-9 place-items-center rounded-full bg-(--w-paper) transition-transform"
                style={{
                  color: cfg.accent,
                  border: `2px solid ${cfg.accent}`,
                  transform: hoveredId === id ? 'translateY(-3px)' : undefined,
                }}
              >
                <SectionIcon section={cfg.section} className="size-4" />
              </span>
              <span className="text-[11px] leading-none font-semibold whitespace-nowrap">{s.section}</span>
              <span className="hidden text-[10px] leading-none font-normal whitespace-nowrap text-(--w-ink-soft) sm:block">
                {s.name}
              </span>
            </button>
          )
        })}
      </div>
      <button
        type="button"
        tabIndex={hidden ? -1 : 0}
        onClick={resetView}
        className="world-card world-btn hidden size-14 shrink-0 justify-center rounded-2xl! sm:flex"
        aria-label={strings.hud.overview}
        title={strings.hud.overview}
      >
        <LocateFixed className="size-5" aria-hidden />
      </button>
      <button
        type="button"
        tabIndex={hidden ? -1 : 0}
        onClick={startRide}
        className="world-btn world-btn-primary size-14 shrink-0 flex-col justify-center gap-0.5 rounded-2xl! text-[10px]"
        aria-label={strings.ride.start}
        title={strings.ride.start}
      >
        <Car className="size-5" aria-hidden />
        {strings.ride.short}
      </button>
    </div>
  )
}
