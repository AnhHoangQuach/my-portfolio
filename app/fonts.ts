import { Be_Vietnam_Pro } from 'next/font/google'

/**
 * Be Vietnam Pro for all text — headings and body. Self-hosted by next/font
 * at build time (no request to Google at runtime). It is not a variable font,
 * so each weight is a file: 400 (body), 500 (labels, buttons) and 700 (titles);
 * `font-semibold` resolves to the nearest loaded weight. The Vietnamese subset
 * is only downloaded when a page actually uses those glyphs (unicode-range).
 *
 * Shared by the locale layout and the global 404 so the @font-face block and
 * its preload are emitted once.
 */
const beVietnamPro = Be_Vietnam_Pro({
  variable: '--font-be-vietnam',
  weight: ['400', '500', '700'],
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
})

export const fontVariables = beVietnamPro.variable
