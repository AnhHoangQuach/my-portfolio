import { useTranslations } from 'next-intl'
import { Section, SectionEyebrow, SectionTitle } from '@/components/section'
import { Reveal } from '@/components/reveal'
import { experiences } from '@/data/experiences'

export function ExperienceSection() {
  const t = useTranslations('experience')

  return (
    <Section id="experience">
      <Reveal>
        <SectionEyebrow index="02">{t('eyebrow')}</SectionEyebrow>
        <SectionTitle className="mb-12 max-w-[20ch]">{t('title')}</SectionTitle>
      </Reveal>

      <div className="flex flex-col">
        {experiences.map((exp) => (
          <Reveal
            key={exp.company}
            className="grid gap-8 rounded-2xl border-t border-hairline px-4 py-7 transition-colors hover:bg-brand-blue/6 lg:grid-cols-3"
          >
            <div>
              <h3 className="font-heading text-xl font-semibold tracking-[-0.02em] text-foreground">
                {exp.company}
              </h3>
              <p className="mt-1.5 text-sm text-dim">{exp.role}</p>
              <p className="mt-2.5 font-mono text-xs text-faint">{exp.period}</p>
              <p className="mt-2.5 max-w-[34ch] text-[0.78rem] leading-[1.55] text-faint">
                {exp.note}
              </p>
            </div>

            <div className="min-w-0 lg:col-span-2">
              <ul className="flex flex-col gap-2.75">
                {exp.points.map((point) => (
                  <li key={point} className="flex gap-3 text-[0.94rem] leading-[1.6] text-dim">
                    <span className="bg-brand-ramp mt-2.25 size-1.25 flex-none rounded-full" />
                    <span className="text-pretty">{point}</span>
                  </li>
                ))}
              </ul>

              <ul className="mt-4 flex flex-wrap gap-2">
                {exp.techStack.map((tech) => (
                  <li
                    key={tech}
                    className="rounded-full border border-hairline px-2.75 py-1.25 font-mono text-[0.69rem] text-faint"
                  >
                    {tech}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
