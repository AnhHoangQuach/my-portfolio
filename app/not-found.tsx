import type { Metadata } from 'next'
import Link from 'next/link'

import { fontVariables } from '@/app/fonts'
import { ThemeProvider } from '@/components/theme-provider'
import { siteConfig } from '@/lib/site-config'
import './globals.css'

export const metadata: Metadata = {
  title: 'Page not found',
  // A soft-404 that returns 200 and gets indexed is a classic crawl-budget
  // sink. Next serves this with a real 404 status; `noindex` closes the gap
  // for anything that already made it into the index.
  robots: { index: false, follow: true },
}

/**
 * The site's 404, and deliberately a static English one.
 *
 * Next treats the global not-found as part of every route's tree, so reading
 * the request here — `getLocale()`, `headers()`, anything — marks the *entire*
 * site dynamic and gives up prerendering on all of it. A 404 nobody should
 * reach is not worth that trade, so the copy is fixed and the page prerenders
 * with everything else.
 *
 * Because the root layout is a pass-through, this owns its own document.
 */
export default function NotFound() {
  const destinations = [
    { href: '/', label: 'Homepage' },
    { href: '/work', label: 'Case studies' },
    { href: '/blog', label: 'Writing' },
    { href: '/#contact', label: 'Contact' },
  ]

  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
            <p className="font-mono text-[0.72rem] tracking-[0.2em] text-faint uppercase">
              404 — not found
            </p>
            <h1 className="max-w-[16ch] font-heading text-4xl leading-[1.06] font-semibold tracking-[-0.03em] text-balance sm:text-5xl">
              This page doesn&apos;t exist.
            </h1>
            <p className="max-w-[46ch] text-base leading-[1.65] text-dim text-pretty">
              The link may be out of date. Try one of these instead.
            </p>

            {/* Real links, not a dead end: a crawler that lands here still
                finds its way to the pages that matter. */}
            <ul className="mt-2 flex flex-wrap justify-center gap-3.5">
              {destinations.map((destination) => (
                <li key={destination.href}>
                  <Link
                    href={destination.href}
                    className="inline-flex items-center rounded-xl border border-hairline bg-foreground/3 px-5 py-3 text-[0.95rem] text-foreground transition-colors duration-250 hover:border-brand-cyan/60 hover:bg-brand-blue/12"
                  >
                    {destination.label}
                  </Link>
                </li>
              ))}
            </ul>

            <p className="mt-4 font-mono text-[0.72rem] text-faint">
              {siteConfig.name} ({siteConfig.alternateName}) · {siteConfig.domain}
            </p>
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}
