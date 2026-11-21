import { DA_NANG_TZ, daNangHour } from './clock'

/**
 * The real Dragon Bridge breathes fire and water at 21:00 on Saturday and
 * Sunday nights, for about a quarter of an hour. The world plays the same
 * show on the same clock (Da Nang time, whatever the visitor's time zone).
 */
export const FIRE_SHOW = {
  days: ['Sat', 'Sun'],
  startHour: 21,
  minutes: 15,
  /** Seconds between bursts while the show is on. */
  burstEvery: 22,
} as const

const weekdayFormat = new Intl.DateTimeFormat('en-US', { timeZone: DA_NANG_TZ, weekday: 'short' })

export function isFireShowLive(now = new Date()) {
  const days: readonly string[] = FIRE_SHOW.days
  if (!days.includes(weekdayFormat.format(now))) return false
  const h = daNangHour(now)
  return h >= FIRE_SHOW.startHour && h < FIRE_SHOW.startHour + FIRE_SHOW.minutes / 60
}

/** `?fireshow=1` plays the show now, for previewing it on a weekday. */
export function fireShowForced() {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('fireshow') === '1'
}
