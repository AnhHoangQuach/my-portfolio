'use client'

import { Award, Languages, GraduationCap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Section, SectionHeader } from '@/components/section'
import { FadeIn, FadeInStagger, FadeInStaggerItem } from '@/components/motion'
import { certifications } from '@/data/certifications'
import { useTranslations } from 'next-intl'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  award: Award,
  languages: Languages,
  'graduation-cap': GraduationCap,
}

export function CertificationsSection() {
  const t = useTranslations('certifications')

  return (
    <Section className="bg-muted/30">
      <FadeIn>
        <SectionHeader title={t('title')} align="center" />
      </FadeIn>

      <FadeInStagger className="grid gap-6 sm:grid-cols-3">
        {certifications.map((cert) => {
          const Icon = iconMap[cert.icon]
          return (
            <FadeInStaggerItem key={cert.title}>
              <Card className="border-border/40 bg-background/50 backdrop-blur-sm text-center transition-all hover:-translate-y-1 hover:border-primary/30">
                <CardContent className="flex flex-col items-center p-8">
                  {Icon && <Icon className="mb-4 h-10 w-10 text-primary" />}
                  <h4 className="text-xl font-bold">{cert.title}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">{cert.subtitle}</p>
                </CardContent>
              </Card>
            </FadeInStaggerItem>
          )
        })}
      </FadeInStagger>
    </Section>
  )
}
