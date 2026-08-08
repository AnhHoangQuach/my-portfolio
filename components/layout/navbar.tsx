'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { ThemeToggle } from '@/components/theme-toggle'
import { LocaleSwitcher } from '@/components/locale-switcher'
import { MobileMenu } from '@/components/layout/mobile-menu'
import type { NavLabels } from '@/components/layout/nav-labels'
import { navItems } from '@/data/navigation'
import { profile } from '@/data/profile'
import { cn } from '@/lib/utils'

/** Distance from the viewport top at which a section counts as "current". */
const SPY_OFFSET = 180

export function Navbar({ labels }: { labels: NavLabels }) {
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState('')
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ids = navItems.map((i) => i.sectionId).filter((id): id is string => Boolean(id))
    let frame = 0

    const measure = () => {
      frame = 0

      // The progress bar is written straight to the DOM. Routing it through
      // state would re-render the whole nav on every scroll frame.
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      if (barRef.current) barRef.current.style.transform = `scaleX(${ratio})`

      setScrolled(window.scrollY > 24)

      let current = ''
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= SPY_OFFSET) current = id
      }
      setActive(current)
    }

    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b border-hairline bg-background/70 backdrop-blur-xl transition-shadow duration-300 supports-backdrop-filter:bg-background/60',
        scrolled && 'shadow-nav',
      )}
    >
      <nav className="mx-auto flex max-w-310 items-center justify-between gap-5 px-5 py-3.5 sm:px-6 lg:px-7">
        {/* The brand goes home, not to `#top`: the navbar also renders on
            /blog and /work/*, where a bare hash just decorates the current URL
            instead of navigating anywhere. On the homepage Next still scrolls
            to the top for a same-route push. */}
        <Link
          href="/"
          className="flex flex-none items-center gap-2.5 font-heading text-[0.97rem] font-semibold tracking-[-0.01em] text-foreground"
        >
          {/* The lockup in public/hayes-logo-light.png stacks the mark over the
              wordmark — far too tall for a 56px header — so the header uses the
              square monogram plate and keeps the name as live text. */}
          <Image
            src="/icon-192.png"
            alt=""
            width={28}
            height={28}
            priority
            className="size-7 rounded-lg"
          />
          {profile.name}
        </Link>

        <div className="hidden items-center gap-4 text-[0.84rem] lg:flex lg:gap-6">
          {navItems.map((item) => {
            const isActive = item.sectionId != null && item.sectionId === active
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex-none py-1.5 transition-colors',
                  isActive ? 'text-foreground' : 'text-faint hover:text-foreground',
                )}
              >
                {labels[item.label]}
                <span
                  className={cn(
                    'bg-brand-line absolute inset-x-0 bottom-0 h-px origin-left transition-transform duration-350',
                    isActive ? 'scale-x-100' : 'scale-x-0',
                  )}
                />
              </Link>
            )
          })}
          <Link
            href="#contact"
            className="flex-none rounded-full border border-brand-cyan/35 bg-brand-blue/10 px-4 py-2.5 whitespace-nowrap text-foreground transition-colors hover:border-brand-cyan/75 hover:bg-brand-blue/25"
          >
            {labels.contact}
          </Link>
        </div>

        <div className="flex items-center gap-1">
          <LocaleSwitcher />
          <ThemeToggle />
          <MobileMenu labels={labels} />
        </div>
      </nav>

      {/* Reading progress */}
      <div className="h-px bg-foreground/5">
        <div
          ref={barRef}
          className="bg-brand-line h-px origin-left scale-x-0 shadow-[0_0_12px_var(--brand-blue)]"
        />
      </div>
    </header>
  )
}
