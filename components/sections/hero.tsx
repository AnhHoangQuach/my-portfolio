import { useTranslations } from 'next-intl'
import { ArrowRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { TerminalCard } from '@/components/hero/terminal-card'
import { PipelineCard } from '@/components/hero/pipeline-card'
import { profile } from '@/data/profile'

export function HeroSection() {
  const t = useTranslations('hero')

  return (
    <section
      className="pt-16 pb-15 md:pt-20 md:pb-18 lg:pt-26 lg:pb-22"
      aria-labelledby="hero-heading"
    >
      {/* Deliberately NOT wrapped in <Reveal>: this block holds the LCP
          element, so it must paint on the server response, not after
          hydration. */}
      <p className="flex items-center gap-3.5 font-mono text-xs tracking-[0.16em] text-faint uppercase">
        <span className="size-1.75 rounded-full bg-brand-cyan shadow-[0_0_12px_var(--brand-cyan)]" />
        {t('eyebrow')}
      </p>

      <h1
        id="hero-heading"
        className="mt-7 max-w-[16ch] font-heading text-[clamp(2.75rem,7.4vw,6.5rem)] leading-[0.98] font-semibold tracking-[-0.035em] text-balance"
      >
        {t('headline')}
      </h1>

      <div className="mt-10 grid items-end gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <p className="max-w-[52ch] text-base leading-[1.65] text-dim text-pretty sm:text-lg">
          {profile.bio}
        </p>

        <div className="flex flex-wrap gap-3.5 pb-1">
          <Link
            href="#work"
            className="bg-brand-ramp inline-flex items-center gap-2.5 rounded-xl px-6 py-4 text-[0.95rem] font-medium text-background shadow-2xl shadow-brand-blue/35 transition-transform duration-250 hover:-translate-y-0.5"
          >
            {t('viewWork')}
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href={profile.resumeUrl}
            className="inline-flex items-center gap-2.5 rounded-xl border border-hairline bg-foreground/3 px-6 py-4 text-[0.95rem] font-medium text-foreground transition-colors duration-250 hover:border-brand-cyan/60 hover:bg-brand-blue/12"
          >
            {t('downloadResume')}
          </Link>
        </div>
      </div>

      {/* Also unrevealed: on a 412×823 phone the terminal card starts around
          y=684, i.e. inside the fold, so gating it on hydration would make it
          the LCP element and push LCP out to hydration time. */}
      <div className="mt-18 grid gap-5.5 lg:grid-cols-2">
        <TerminalCard title={t('terminalTitle')} />
        <PipelineCard title={t('pipelineTitle')} />
      </div>
    </section>
  )
}
