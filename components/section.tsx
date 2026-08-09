import { cn } from '@/lib/utils'

interface SectionProps {
  id?: string
  children: React.ReactNode
  className?: string
  /** Sections are separated by a hairline rule; the hero opts out. */
  divider?: boolean
}

export function Section({ id, children, className, divider = true }: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        'scroll-mt-20 py-18 md:py-24 lg:py-31',
        divider && 'border-t border-hairline',
        className,
      )}
    >
      {children}
    </section>
  )
}

/** Mono, wide-tracked kicker — "03 — Featured Work". */
export function SectionEyebrow({ index, children }: { index: string; children: React.ReactNode }) {
  return (
    <div className="font-mono text-[0.72rem] tracking-[0.2em] text-faint uppercase">
      {index} — {children}
    </div>
  )
}

/**
 * Section heading. Defaults to `h2` because the one-pager's only `h1` is the
 * hero — but standalone routes (/blog, /work) are their own documents and need
 * their lead heading to be the `h1`, so they pass `as="h1"`. Same type scale
 * either way; the change is purely in the outline a crawler reads.
 */
export function SectionTitle({
  children,
  className,
  as: Tag = 'h2',
}: {
  children: React.ReactNode
  className?: string
  as?: 'h1' | 'h2'
}) {
  return (
    <Tag
      className={cn(
        'mt-5 font-heading text-3xl leading-[1.06] font-semibold tracking-[-0.03em] text-balance sm:text-4xl lg:text-5xl',
        className,
      )}
    >
      {children}
    </Tag>
  )
}

/** Supporting paragraph that sits directly under a section title. */
export function SectionLead({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <p className={cn('mt-3 max-w-[56ch] text-base text-faint text-pretty', className)}>{children}</p>
  )
}
