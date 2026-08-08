import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { GithubIcon, LinkedinIcon } from '@/components/icons'
import { SectionEyebrow } from '@/components/section'
import { Reveal } from '@/components/reveal'
import { profile } from '@/data/profile'
import { siteConfig } from '@/lib/site-config'

export function ContactSection() {
  const t = useTranslations('contact')

  return (
    <section
      id="contact"
      className="scroll-mt-20 border-t border-hairline pt-22 pb-10 md:pt-28 lg:pt-35"
    >
      <Reveal className="text-center">
        <SectionEyebrow index="07">{t('eyebrow')}</SectionEyebrow>

        <h2 className="mx-auto mt-6 max-w-[15ch] font-heading text-[clamp(2.375rem,6.4vw,5.375rem)] leading-[1.02] font-semibold tracking-[-0.035em] text-balance">
          {t('title')}
        </h2>

        <p className="mx-auto mt-6 max-w-[52ch] text-lg leading-[1.65] text-dim">
          {t('description')}
        </p>

        <div className="mt-9 flex flex-wrap justify-center gap-3.5">
          <a
            href={`mailto:${profile.email}`}
            className="bg-brand-ramp inline-flex items-center gap-2.5 rounded-xl px-7 py-4 text-[0.97rem] font-medium text-background shadow-2xl shadow-brand-blue/40 transition-transform duration-250 hover:-translate-y-0.5"
          >
            {profile.email}
          </a>
          <Link
            href={siteConfig.links.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 rounded-xl border border-hairline bg-foreground/3 px-6 py-4 text-[0.97rem] text-foreground transition-colors hover:border-brand-cyan/60 hover:bg-brand-blue/12"
          >
            <LinkedinIcon className="size-4" />
            LinkedIn
          </Link>
          <Link
            href={siteConfig.links.github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 rounded-xl border border-hairline bg-foreground/3 px-6 py-4 text-[0.97rem] text-foreground transition-colors hover:border-brand-cyan/60 hover:bg-brand-blue/12"
          >
            <GithubIcon className="size-4" />
            GitHub
          </Link>
        </div>
      </Reveal>
    </section>
  )
}
