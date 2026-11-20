import { Space_Grotesk } from 'next/font/google'

/**
 * One web font only: Space Grotesk for display type (titles, names, panel
 * headings). Body copy and the small mono labels use the platform's own UI
 * fonts (see `app/globals.css`), which cost nothing to download.
 *
 * Shared by the locale layout and the global 404 so the @font-face block and
 * its preload are emitted once.
 */
const spaceGrotesk = Space_Grotesk({
  variable: '--font-display',
  subsets: ['latin'],
  display: 'swap',
})

export const fontVariables = spaceGrotesk.variable
