import { ChevronRight } from 'lucide-react'

import { Link } from '@/i18n/navigation'

export interface Crumb {
  label: string
  /** Omitted on the final crumb — the current page is not a link. */
  href?: string
}

/**
 * Visible breadcrumb trail. Pairs with `breadcrumbSchema()` in lib/schema.ts:
 * Google wants the markup and the rendered trail to agree, and the links
 * themselves push authority from leaf pages back up to /work and the homepage.
 */
export function Breadcrumbs({ trail }: { trail: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 font-mono text-[0.72rem] text-faint">
        {trail.map((crumb, i) => {
          const isLast = i === trail.length - 1
          return (
            <li key={crumb.label} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight aria-hidden className="size-3 text-faint/60" />}
              {crumb.href && !isLast ? (
                <Link href={crumb.href} className="transition-colors hover:text-foreground">
                  {crumb.label}
                </Link>
              ) : (
                <span className="max-w-[28ch] truncate text-dim" aria-current="page">
                  {crumb.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
