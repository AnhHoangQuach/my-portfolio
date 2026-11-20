'use client'

import { useEffect, useState } from 'react'
import { Globe, LocateFixed, Menu, MousePointerClick, X } from 'lucide-react'

import { usePathname, useRouter } from '@/i18n/navigation'
import { LANDMARKS, LANDMARK_ORDER } from '@/lib/world/landmarks'
import { useWorld } from '@/lib/world/store'
import { cn } from '@/lib/utils'
import { SectionIcon } from '../section-icon'
import type { WorldStrings } from '../strings'

/**
 * Game-style heads-up display: identity badge, section menu, landmark dock,
 * overview button and a one-time controls hint. Only shown while exploring.
 */
export function Hud({ strings, locale }: { strings: WorldStrings; locale: string }) {
  const phase = useWorld((s) => s.phase)
  const activeId = useWorld((s) => s.activeId)
  if (phase !== 'explore') return null

  return (
    <>
      <IdentityBadge strings={strings} />
      <TopMenu strings={strings} locale={locale} />
      <Dock strings={strings} hidden={activeId !== null} />
      <ControlsHint text={strings.hud.hint} />
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

function LocaleToggle({ strings, locale }: { strings: WorldStrings; locale: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const next = locale === 'en' ? 'ja' : 'en'
  return (
    <button
      type="button"
      onClick={() => router.replace(pathname, { locale: next })}
      className="world-btn world-btn-ghost px-3 py-1.5 text-xs"
      aria-label={`${strings.hud.localeLabel} — ${strings.hud.switchLocale}`}
    >
      <Globe className="size-3.5" aria-hidden />
      {strings.hud.localeLabel}
    </button>
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
              <LocaleToggle strings={strings} locale={locale} />
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
    </div>
  )
}

function ControlsHint({ text }: { text: string }) {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const t = window.setTimeout(() => setVisible(false), 7000)
    return () => window.clearTimeout(t)
  }, [])
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-x-0 top-20 z-30 flex justify-center px-4 transition-opacity duration-700',
        visible ? 'opacity-100' : 'opacity-0',
      )}
      aria-hidden={!visible}
    >
      <p className="world-card flex items-center gap-2 rounded-full! px-4 py-2 text-xs font-medium text-(--w-ink-soft)">
        <MousePointerClick className="size-4 text-(--w-wood)" aria-hidden />
        {text}
      </p>
    </div>
  )
}
