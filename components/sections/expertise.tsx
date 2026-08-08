import { useTranslations } from 'next-intl'
import { Activity, Cloud, Database, Layers, Network, Server } from 'lucide-react'
import { Section, SectionEyebrow, SectionTitle } from '@/components/section'
import { Reveal, RevealGroup } from '@/components/reveal'
import { expertiseAreas } from '@/data/expertise'
import type { ExpertiseArea } from '@/types'

const iconMap: Record<ExpertiseArea['icon'], React.ComponentType<{ className?: string }>> = {
  backend: Server,
  frontend: Layers,
  data: Database,
  cloud: Cloud,
  architecture: Network,
  testing: Activity,
}

export function ExpertiseSection() {
  const t = useTranslations('expertise')

  return (
    <Section id="expertise">
      <Reveal>
        <SectionEyebrow index="04">{t('eyebrow')}</SectionEyebrow>
        <SectionTitle className="mb-12 max-w-[18ch]">{t('title')}</SectionTitle>
      </Reveal>

      <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {expertiseAreas.map((area) => {
          const Icon = iconMap[area.icon]
          return (
            <Reveal
              key={area.title}
              className="group flex h-full flex-col rounded-2xl border border-hairline bg-foreground/2 p-6 transition-colors duration-350 hover:border-brand-cyan/35 hover:bg-foreground/4"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex size-10 items-center justify-center rounded-xl border border-brand-cyan/25 bg-brand-cyan/10 text-brand-cyan">
                  <Icon className="size-5" />
                </span>
                {/* Mono index echoes the section kickers ("04 — Technical
                    Expertise") rather than adding a second decorative system. */}
                <span aria-hidden className="font-mono text-xs tracking-[0.16em] text-faint">
                  {area.n}
                </span>
              </div>

              <h3 className="mt-5 font-heading text-lg font-semibold tracking-[-0.015em]">
                {area.title}
              </h3>

              <p className="mt-2.5 flex-1 text-sm leading-[1.65] text-faint text-pretty">
                {area.note}
              </p>

              {/* Borderless chips: one outline per item turned the card into a
                  mesh of lines at these sizes. */}
              <ul className="mt-5 flex flex-wrap gap-1.5">
                {area.items.map((item) => (
                  <li
                    key={item}
                    className="rounded-md bg-foreground/6 px-2 py-1 font-mono text-[0.69rem] text-dim"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          )
        })}
      </RevealGroup>
    </Section>
  )
}
