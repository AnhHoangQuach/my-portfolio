'use client'

import { Section } from '@/components/section'
import { Card, CardContent } from '@/components/ui/card'
import { FadeInStagger, FadeInStaggerItem } from '@/components/motion'
import { profile } from '@/data/profile'
import { useTranslations } from 'next-intl'

export function AboutSection() {
  const t = useTranslations('about')

  const stats = [
    { value: `${profile.yearsOfExperience}+`, label: t('yearsExperience') },
    { value: `${profile.projectCount}+`, label: t('globalProjects') },
    { value: `${profile.certificationCount}`, label: t('certifications') },
    { value: profile.languageProficiency, label: t('langProficiency') },
  ]

  return (
    <Section id="about" className="bg-muted/30">
      <FadeInStagger className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {stats.map((stat) => (
          <FadeInStaggerItem key={stat.label}>
            <Card className="border-border/40 bg-background/50 backdrop-blur-sm text-center">
              <CardContent className="p-6 md:p-8">
                <div className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          </FadeInStaggerItem>
        ))}
      </FadeInStagger>
    </Section>
  )
}
