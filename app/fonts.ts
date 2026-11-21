import { Be_Vietnam_Pro } from 'next/font/google'

/**
 * Be Vietnam Pro for all text — headings and body. Self-hosted by next/font
 * at build time (no request to Google at runtime). It is not a variable font,
 * so each weight is a file: 400 (body), 500 (labels, buttons) and 700 (titles);
 * `font-semibold` resolves to the nearest loaded weight.
 *
 * Latin only: the site's copy (EN / JA) has no Vietnamese-specific glyphs,
 * and next/font preloads every listed subset — the Vietnamese files were
 * three extra high-priority downloads ahead of the first paint. If copy with
 * Vietnamese diacritics (ơ, ư, ạ, Đ…) is added, put `'vietnamese'` back.
 *
 * Shared by the locale layout and the global 404 so the @font-face block and
 * its preload are emitted once.
 */
const beVietnamPro = Be_Vietnam_Pro({
  variable: '--font-be-vietnam',
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
})

export const fontVariables = beVietnamPro.variable
