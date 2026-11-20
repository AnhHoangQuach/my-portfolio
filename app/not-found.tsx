import type { Metadata } from 'next'
import Link from 'next/link'

import { fontVariables } from '@/app/fonts'
import './globals.css'

export const metadata: Metadata = {
  title: 'Page not found',
  // A soft-404 that returns 200 and gets indexed is a crawl-budget sink. Next
  // serves this with a real 404 status; `noindex` closes the gap for anything
  // that already made it into the index.
  robots: { index: false, follow: true },
}

/**
 * The site's 404, deliberately static English. Reading the request here
 * (`getLocale()`, `headers()`, …) would mark the whole site dynamic, so the
 * copy is fixed and the page prerenders with everything else. The root
 * layout is a pass-through, so this owns its own document.
 */
export default function NotFound() {
  return (
    <html lang="en" className={fontVariables}>
      <body className="grid min-h-dvh place-items-center bg-linear-to-b from-[#bfe3ef] to-[#fff0d6] px-6 font-sans text-[#3e3a34] antialiased">
        <main className="flex max-w-md flex-col items-center gap-5 text-center">
          <p className="font-mono text-xs tracking-[0.2em] text-[#7e573e] uppercase">404 — lost at sea</p>
          <h1 className="font-heading text-4xl font-bold text-balance">This page doesn&apos;t exist.</h1>
          <p className="text-[#6f675c]">The link may be out of date. The whole journey starts from the map.</p>
          {/* Real links, not a dead end: a crawler that lands here still finds the site. */}
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="rounded-full bg-[#f2b632] px-5 py-2.5 font-semibold text-[#3a2a10] shadow-sm transition-transform hover:-translate-y-0.5"
            >
              Back to the map
            </Link>
            <Link
              href="/?at=contact"
              className="rounded-full border border-[#a87959]/40 bg-white/70 px-5 py-2.5 font-semibold transition-transform hover:-translate-y-0.5"
            >
              Contact
            </Link>
          </div>
        </main>
      </body>
    </html>
  )
}
