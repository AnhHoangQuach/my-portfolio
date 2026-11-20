import type { LandmarkId } from '@/lib/world/landmarks'

/**
 * Every UI string the client needs, resolved on the server and passed down as
 * props — the translation catalogue never ships to the browser.
 */
export interface WorldStrings {
  /** Small label above the name / title, e.g. "Portfolio". */
  kicker: string
  identity: { name: string; initials: string; role: string; location: string }
  loading: { title: string; stages: string[] }
  intro: { title: string; subtitle: string; explore: string; skip: string }
  hud: {
    menu: string
    closeMenu: string
    overview: string
    hint: string
    journey: string
    switchLocale: string
    /** Time-of-day control. */
    timeOfDay: string
    daNang: string
    day: string
    night: string
    localeLabel: string
  }
  panel: { back: string; next: string; previous: string; stop: string }
  fallback: { title: string; body: string; cta: string }
  landmarks: Record<LandmarkId, { name: string; section: string; blurb: string }>
}
