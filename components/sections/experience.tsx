'use client'

import { Badge } from '@/components/ui/badge'
import { Section, SectionHeader } from '@/components/section'
import { FadeIn, FadeInStagger, FadeInStaggerItem, SlideIn } from '@/components/motion'
import { experiences } from '@/data/experiences'
import { useTranslations } from 'next-intl'

export function ExperienceSection() {
  const t = useTranslations('experience')

  return (
    <Section id="experience" className="bg-muted/30">
      <FadeIn>
        <SectionHeader title={t('title')} align="center" />
      </FadeIn>

      <div className="relative mx-auto max-w-3xl">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 h-full w-px bg-border md:left-1/2 md:-translate-x-px" />

        <FadeInStagger className="space-y-16">
          {experiences.map((exp) => (
            <FadeInStaggerItem key={exp.company} className="relative">
              <div className="flex flex-col md:flex-row md:gap-12">
                {/* Timeline dot with pulse animation */}
                <div className="absolute left-4 top-1 z-10 h-3 w-3 -translate-x-1/2 rounded-full bg-primary ring-4 ring-primary/20 md:left-1/2">
                  <span className="absolute inset-0 animate-ping rounded-full bg-primary/40" />
                </div>

                {/* Duration - left side on desktop */}
                <SlideIn
                  direction="left"
                  className="mb-4 pl-10 md:mb-0 md:w-1/2 md:pl-0 md:pr-12 md:text-right"
                >
                  <span className="text-sm font-semibold tracking-widest text-primary uppercase">
                    {exp.duration}
                  </span>
                </SlideIn>

                {/* Content - right side on desktop */}
                <SlideIn direction="right" className="pl-10 md:w-1/2 md:pl-12">
                  <h3 className="text-2xl font-bold">{exp.company}</h3>
                  <p className="mt-1 font-medium text-muted-foreground">{exp.role}</p>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {exp.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {exp.techStack.map((tech) => (
                      <Badge key={tech} variant="outline" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </SlideIn>
              </div>
            </FadeInStaggerItem>
          ))}
        </FadeInStagger>
      </div>
    </Section>
  )
}
