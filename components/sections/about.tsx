import { useTranslations } from 'next-intl'
import { Section, SectionEyebrow, SectionTitle } from '@/components/section'
import { Reveal } from '@/components/reveal'
import { profile } from '@/data/profile'

export function AboutSection() {
  const t = useTranslations('about')

  const facts = [
    { key: `${profile.yearsOfExperience} yrs`, label: t('factYears') },
    { key: String(profile.companyCount), label: t('factCompanies') },
    { key: t('factLeadValue'), label: t('factLead') },
    { key: 'PSM 1', label: t('factScrum') },
  ]

  return (
    <Section id="about">
      <Reveal className="grid gap-14 lg:grid-cols-2">
        <div>
          <SectionEyebrow index="01">{t('eyebrow')}</SectionEyebrow>
          <SectionTitle className="max-w-[14ch]">{t('title')}</SectionTitle>
        </div>

        <div className="flex max-w-[60ch] flex-col gap-5.5 text-[1.03rem] leading-[1.7] text-dim">
          <p className="text-pretty">{t('paragraphOne')}</p>
          <p className="text-pretty">{t('paragraphTwo')}</p>

          <dl className="mt-2 grid grid-cols-2 gap-5 sm:grid-cols-4">
            {facts.map((fact) => (
              <div key={fact.label} className="border-l border-brand-cyan/30 pl-3.5">
                <dt className="font-heading text-2xl font-semibold text-foreground">{fact.key}</dt>
                <dd className="mt-1 text-[0.78rem] leading-[1.45] text-faint">{fact.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Reveal>
    </Section>
  )
}
