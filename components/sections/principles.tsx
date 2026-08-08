import { useTranslations } from 'next-intl'
import { Section, SectionEyebrow, SectionTitle } from '@/components/section'
import { Reveal } from '@/components/reveal'
import { principles } from '@/data/principles'

export function PrinciplesSection() {
  const t = useTranslations('principles')

  return (
    <Section>
      <Reveal>
        <SectionEyebrow index="06">{t('eyebrow')}</SectionEyebrow>
        <SectionTitle className="mb-12 max-w-[16ch]">{t('title')}</SectionTitle>
      </Reveal>

      <div className="flex flex-col">
        {principles.map((principle) => (
          <Reveal
            key={principle.n}
            className="grid items-baseline gap-7 border-t border-hairline px-4 py-6.5 transition-colors hover:bg-brand-violet/6 lg:grid-cols-2"
          >
            <div className="flex items-baseline gap-4.5">
              <span className="font-mono text-xs text-faint">{principle.n}</span>
              <h3 className="font-heading text-xl font-medium tracking-[-0.02em] sm:text-2xl lg:text-3xl">
                {principle.title}
              </h3>
            </div>
            <p className="max-w-[56ch] text-[0.94rem] leading-[1.65] text-faint text-pretty">
              {principle.body}
            </p>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
