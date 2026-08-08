import { useTranslations } from 'next-intl'
import { Section, SectionEyebrow, SectionLead, SectionTitle } from '@/components/section'
import { Reveal, RevealGroup } from '@/components/reveal'
import { practiceItems } from '@/data/practice'

export function PracticeSection() {
  const t = useTranslations('practice')

  return (
    <Section id="practice">
      <Reveal>
        <SectionEyebrow index="05">{t('eyebrow')}</SectionEyebrow>
        <SectionTitle className="max-w-[20ch]">{t('title')}</SectionTitle>
        <SectionLead className="mb-12 max-w-[58ch]">{t('description')}</SectionLead>
      </Reveal>

      <RevealGroup className="grid gap-5.5 sm:grid-cols-2 lg:grid-cols-3">
        {practiceItems.map((item) => (
          <Reveal
            key={item.title}
            className="bg-panel-gradient rounded-2xl border border-hairline p-7 transition-[border-color,transform] duration-350 hover:-translate-y-0.75 hover:border-brand-cyan/40"
          >
            <p className="font-mono text-[0.69rem] tracking-[0.16em] text-brand-cyan uppercase">
              {item.kicker}
            </p>
            <h3 className="mt-3.5 font-heading text-xl font-semibold tracking-[-0.02em]">
              {item.title}
            </h3>
            <p className="mt-3 text-[0.9rem] leading-[1.65] text-faint text-pretty">{item.body}</p>
          </Reveal>
        ))}
      </RevealGroup>
    </Section>
  )
}
