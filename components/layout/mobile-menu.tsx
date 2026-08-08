'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Menu } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { navItems } from '@/data/navigation'
import { profile } from '@/data/profile'
import type { NavLabels } from './nav-labels'

// The sheet pulls in focus-trap / dismissable-layer machinery that only
// matters once the menu is opened, so it stays out of the initial bundle.
const Sheet = dynamic(() => import('@/components/ui/sheet').then((m) => m.Sheet))
const SheetContent = dynamic(() => import('@/components/ui/sheet').then((m) => m.SheetContent))
const SheetTitle = dynamic(() => import('@/components/ui/sheet').then((m) => m.SheetTitle))

export function MobileMenu({ labels }: { labels: NavLabels }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label={labels.openMenu}
        onClick={() => setOpen(true)}
      >
        <Menu className="size-5" />
      </Button>

      {open && (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="right" className="w-72">
            <SheetTitle className="sr-only">{labels.menu}</SheetTitle>
            <div className="flex flex-col gap-6 p-6 pt-10">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="font-heading text-lg font-medium text-dim transition-colors hover:text-foreground"
                  onClick={() => setOpen(false)}
                >
                  {labels[item.label]}
                </Link>
              ))}
              <Link
                href="#contact"
                className="font-heading text-lg font-medium text-brand-cyan"
                onClick={() => setOpen(false)}
              >
                {labels.contact}
              </Link>
              <Link
                href={profile.resumeUrl}
                className="mt-2 rounded-xl border border-hairline px-4 py-3 text-center text-sm text-dim transition-colors hover:border-brand-cyan/50 hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                {labels.resume}
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  )
}
