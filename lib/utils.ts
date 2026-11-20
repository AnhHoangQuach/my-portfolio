/**
 * Joins truthy class names. Deliberately not clsx + tailwind-merge: the UI
 * never relies on later classes overriding earlier ones, so a plain join is
 * all it needs and nothing extra ships to the browser.
 */
export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ')
}
