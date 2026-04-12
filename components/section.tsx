import { cn } from '@/lib/utils'

interface SectionProps {
  id?: string
  children: React.ReactNode
  className?: string
}

export function Section({ id, children, className }: SectionProps) {
  return (
    <section id={id} className={cn('py-24 px-6 md:px-8 lg:py-32', className)}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  )
}

interface SectionHeaderProps {
  title: string
  description?: string
  className?: string
  align?: 'left' | 'center'
}

export function SectionHeader({
  title,
  description,
  className,
  align = 'left',
}: SectionHeaderProps) {
  return (
    <div className={cn('mb-16', align === 'center' && 'text-center', className)}>
      <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">{title}</h2>
      {description && <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{description}</p>}
    </div>
  )
}
