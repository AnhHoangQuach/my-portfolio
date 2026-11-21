/**
 * The real clock in Da Nang (UTC+7) and the fixed Day / Night hours. Plain
 * functions with no three.js, so the HUD and the welcome screen can use them
 * without pulling the 3D bundle into the page's first load. The sky and the
 * shader uniforms that follow the clock live in `daylight.ts`.
 */

export const DA_NANG_TZ = 'Asia/Ho_Chi_Minh'

/** Fixed hours used by the manual Day / Night override. */
export const DAY_HOUR = 10.5
export const NIGHT_HOUR = 21

/** Where the Auto / Day / Night choice is remembered; storage may be unavailable, so guard every access. */
export const TIME_MODE_KEY = 'world-time-mode'

const clockFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: DA_NANG_TZ,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

/** Current hour in Da Nang as a fraction, e.g. 21.5 for 21:30. */
export function daNangHour(now = new Date()) {
  const parts = clockFormat.formatToParts(now)
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 12) % 24
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0)
  return h + m / 60
}

/** "21:34" for a fractional hour. */
export function formatHour(hour: number) {
  const h = Math.floor(hour) % 24
  const m = Math.floor((hour - Math.floor(hour)) * 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Parses `?time=` values: "day", "night" or "HH:MM". */
export function parseTimeParam(value: string | null): number | null {
  if (!value) return null
  if (value === 'day') return DAY_HOUR
  if (value === 'night') return NIGHT_HOUR
  const m = /^(\d{1,2}):(\d{2})$/.exec(value)
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  return h < 24 && min < 60 ? h + min / 60 : null
}
