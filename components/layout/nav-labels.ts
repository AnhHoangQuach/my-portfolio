/**
 * The navbar is the only Client Component that needs translated strings.
 * Resolving them on the server and passing them down means `next-intl`'s
 * client runtime — and the message catalogue — never reach the browser.
 */
import type { NavLabelKey } from '@/types'

export const NAV_LABEL_KEYS: readonly NavLabelKey[] = [
  'about',
  'experience',
  'work',
  'expertise',
  'practice',
  'blog',
  'contact',
  'resume',
  'menu',
  'openMenu',
]

export type NavLabels = Record<NavLabelKey, string>
