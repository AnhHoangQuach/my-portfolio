import { Geist, JetBrains_Mono, Space_Grotesk } from 'next/font/google'

/**
 * Shared across the locale layout and the global 404, which own separate
 * `<html>` trees. Instantiating `next/font` twice would emit two copies of the
 * same @font-face block and two preloads, so both import from here.
 */
const geist = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  variable: '--font-heading',
  subsets: ['latin'],
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono-family',
  subsets: ['latin'],
  display: 'swap',
})

export const fontVariables = `${geist.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`
